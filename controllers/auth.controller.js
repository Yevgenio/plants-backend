// const bcrypt = require('bcrypt');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

const COOKIE_OPTIONS = {
  path: '/',
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'Strict',
  ...(process.env.NODE_ENV === 'production' && { domain: '.boukingolts.art' }),
};

exports.me = async (req, res) => {
  try {
    const user = req.user;
    // Respond with the user data
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.status = async (req, res) => {
  const access_token = req.cookies?.access_token;
  const refresh_token = req.cookies?.refresh_token;

  const notLoggedIn = () => res.json({ isLoggedIn: false });

  // Try access token
  if (access_token) {
    try {
      const decoded = jwt.verify(access_token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      if (!user) return notLoggedIn();
      return res.json({ isLoggedIn: true, isAdmin: user.role === 'admin', username: user.username });
    } catch (err) {
      if (err.name !== 'TokenExpiredError') return notLoggedIn();
      // fall through to refresh
    }
  }

  // Try refresh token
  if (refresh_token) {
    try {
      const decoded = jwt.verify(refresh_token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      if (!user) return notLoggedIn();
      const newAccessToken = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
      res.cookie('access_token', newAccessToken, { ...COOKIE_OPTIONS, maxAge: 60 * 60 * 1000 });
      return res.json({ isLoggedIn: true, isAdmin: user.role === 'admin', username: user.username });
    } catch {
      return notLoggedIn();
    }
  }

  return notLoggedIn();
};

exports.signup = async (req, res) => {

  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = new User({
      username: req.body.username,
      email: req.body.email,
      password: hashedPassword,
    });
    await user.save();
    res.status(201).json({ message: 'User created!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
      return res.status(401).json({ message: 'User authentication failed' });
    }

    const username = user.username;

    // Access token (1-hour expiration)
    const access_token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Refresh token (6-month expiration)
    const refresh_token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '180d' }
    );

    // Set the access token as HTTP-only cookie
    res.cookie('access_token', access_token, { ...COOKIE_OPTIONS, maxAge: 30 * 60 * 1000 });

    // Optionally set refresh token too
    res.cookie('refresh_token', refresh_token, {
      ...COOKIE_OPTIONS,
      maxAge: 3 * 30 * 24 * 60 * 60 * 1000, // 3 months
    });

    // Server-side login endpoint (Node.js)
    res.cookie('user_role', user.role, {
      ...COOKIE_OPTIONS,
      httpOnly: false, //  false to access it from client
      maxAge: 30 * 60 * 1000, // 30 minutes
    });

    res.status(200).json({ username, access_token, refresh_token });    
  } catch (err) {
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

exports.settings = async (req, res) => {
  try {
    const userWithPassword = await User.findById(req.user._id).lean();
    const { password, ...rest } = userWithPassword;
    res.json({ ...rest, hasPassword: !!password });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { username, email } = req.body;
    if (email && email !== req.user.email) {
      const existing = await User.findOne({ email });
      if (existing) return res.status(409).json({ message: 'Email already in use' });
    }
    const updated = await User.findByIdAndUpdate(
      req.user._id,
      { ...(username && { username }), ...(email && { email }) },
      { new: true }
    ).select('-password');
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ message: 'Both fields required' });
    const user = await User.findById(req.user._id);
    if (!user.password) return res.status(400).json({ message: 'Password change not available for this account' });
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(401).json({ message: 'Current password is incorrect' });
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.logout = async (req, res) => {
  try {
    // Clear the cookies
    res.clearCookie('access_token', {
      ...COOKIE_OPTIONS,
    });
    res.clearCookie('refresh_token', {
      ...COOKIE_OPTIONS,
    });
    res.clearCookie('user_role', user.role, {
      ...COOKIE_OPTIONS,
      httpOnly: false,
    });
    
    
    // TODO: maybe invalidate the refresh token in the database (if stored)

    res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
        console.error('Logout error:', err.message); // Log the error for debugging

    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
}

exports.refreshToken = async (req, res) => {
  try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
          return res.status(400).json({ message: 'Refresh token is required' });
      }

      // Verify the refresh token
      jwt.verify(refreshToken, process.env.JWT_SECRET, async (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid refresh token' });
        }

        // Check if user exists
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const username = user.username;

        // Generate a new access token
        const newAccessToken = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.cookie('access_token', newAccessToken, { ...COOKIE_OPTIONS, maxAge: 60 * 60 * 1000 });

        res.status(200).json({username: username, access_token: newAccessToken });
      });
  } catch (err) {
      res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};
