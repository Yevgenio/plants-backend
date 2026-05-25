const express = require('express');
const router = express.Router();
// const jwt = require('jsonwebtoken');
// const bcrypt = require('bcrypt');
const authController = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const User = require('../models/user.model'); // Adjust the path based on your project structure

// const User = require('../models/user.model');

router.get('/me', verifyToken, authController.me);

router.get('/status', verifyToken, authController.status);

router.post('/signup', authController.signup);

router.post('/login', authController.login);

router.get('/logout', verifyToken, authController.logout);

router.get('/settings', verifyToken, authController.settings);

router.get('/profile', verifyToken, authController.settings);

router.put('/profile', verifyToken, authController.updateProfile);

router.put('/password', verifyToken, authController.updatePassword);

router.post('/refresh', authController.refreshToken);

// router.get('/is-admin', authController.isAdmin)

// google login route ===========================================================
const passport = require('passport');
const jwt = require('jsonwebtoken');

// Google Login Route
//router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
// Google login for Android
router.post('/google/web', passport.authenticate('google', { session: false }), (req, res) => {
    // Generate and return tokens after successful login
    const token = jwt.sign({ userId: req.user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ userId: req.user._id }, process.env.JWT_SECRET, { expiresIn: '180d' });

    res.json({ token, refreshToken });
});


// Google Callback Route
router.get('/google/web/callback', 
    passport.authenticate('google', { session: false }),
    (req, res) => {
        // Generate tokens
        const token = jwt.sign({ userId: req.user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        const refreshToken = jwt.sign({ userId: req.user._id }, process.env.JWT_SECRET, { expiresIn: '180d' }); // 6 months
        res.json({ token, refreshToken });
    }
);

const { OAuth2Client } = require('google-auth-library');

// Use the Web Client ID for verification
const client = new OAuth2Client(process.env.GOOGLE_WEB_CLIENT_ID);
router.post('/google/android', async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: 'ID token is required' });
    }

    // Verify the ID token using the Web Client ID
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_WEB_CLIENT_ID, // Web Client ID
    });

    const payload = ticket.getPayload();
    const email = payload.email;

    let user = await User.findOne({ email });
    if (!user) {
      user = new User({
        username: payload.name,
        email: payload.email,
        avatar: payload.picture,
      });
      await user.save();
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '180d' });

    res.json({ token, refreshToken });
  } catch (err) {
    console.error('Error during Google login:', err.message);
    res.status(500).json({ message: 'Google login failed', error: err.message });
  }
});


router.get('/google/android/callback', passport.authenticate('google-android', { session: false }), (req, res) => {
    // Handle tokens and login success
    const token = jwt.sign({ userId: req.user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ userId: req.user._id }, process.env.JWT_SECRET, { expiresIn: '180d' });

    res.json({ token, refreshToken });
});


module.exports = router;