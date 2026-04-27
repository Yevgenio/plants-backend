// const bcrypt = require('bcrypt');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

const COOKIE_OPTIONS = {
  path: '/',
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'Strict',
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
  try {
    const user = req.user; // This is populated by the `verifyToken` middleware

    // Respond with only the relevant fields
    res.json({
      username: user.username,
      isAdmin: user.role === 'admin',
      isVerified: user.isVerified || false, // Assuming you have an `isVerified` field
      userLanguage: user.language || 'en', // Assuming you have a `language` field
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
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
      { userId: user._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1h' }
    );

    // Refresh token (6-month expiration)
    const refresh_token = jwt.sign(
      { userId: user._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: '180d' } // 6 months
    );

    // Set the access token as HTTP-only cookie
    res.cookie('access_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Use HTTPS only in production
      sameSite: 'Strict',
      maxAge: 30 * 60 * 1000, // 30 minutes
    });

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
    const user = req.user;
    // Respond with the user data
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
}

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
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.cookie('access_token', newAccessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'Strict',
          maxAge: 60 * 60 * 1000, // 1 hour (match JWT expiry)
        });

        res.status(200).json({username: username, access_token: newAccessToken });
      });
  } catch (err) {
      res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};
