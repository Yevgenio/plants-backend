const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/user.model');
const { API_URL } = require('./env');

const clientIDs = {
    web: {
        clientID: process.env.GOOGLE_WEB_CLIENT_ID,
        clientSecret: process.env.GOOGLE_WEB_CLIENT_SECRET,
    },
    android: {
        clientID: process.env.GOOGLE_ANDROID_CLIENT_ID,
    },
    ios: {
        clientID: process.env.GOOGLE_IOS_CLIENT_ID,
    },
};

passport.use('google', new GoogleStrategy({
    clientID: clientIDs.web.clientID,
    clientSecret: clientIDs.web.clientSecret,
    callbackURL: `${API_URL}/api/auth/google/callback`,
}, async (accessToken, refreshToken, profile, done) => {
    try {
        // Find or create user
        let user = await User.findOne({ email: profile.emails[0].value });
        if (!user) {
            user = new User({
                username: profile.displayName,
                email: profile.emails[0].value,
                avatar: profile.photos[0]?.value,
            });
            await user.save();
        }
        return done(null, user); // Pass user to Passport
    } catch (err) {
        return done(err, null);
    }
}));

passport.use('google-android', new GoogleStrategy({
    clientID: process.env.GOOGLE_ANDROID_CLIENT_ID, // Use the Android client_id
    callbackURL: '/api/auth/google/android/callback', // Adjust this to match your API path
}, async (accessToken, refreshToken, profile, done) => {
    try {
        // Find or create user
        let user = await User.findOne({ email: profile.emails[0].value });
        if (!user) {
            user = new User({
                username: profile.displayName,
                email: profile.emails[0].value,
                avatar: profile.photos[0]?.value,
            });
            await user.save();
        }
        return done(null, user); // Pass the user to Passport
    } catch (err) {
        return done(err, null);
    }
}));

// passport.use('google-ios', new GoogleStrategy({
//     clientID: clientIDs.ios.clientID,
//     //clientSecret: clientIDs.ios.clientSecret,
//     callbackURL: 'https://boukingolts.art/api/auth/google/ios/callback',
// }, async (accessToken, refreshToken, profile, done) => {
//     try {
//         // Find or create user
//         let user = await User.findOne({ email: profile.emails[0].value });
//         if (!user) {
//             user = new User({
//                 username: profile.displayName,
//                 email: profile.emails[0].value,
//                 avatar: profile.photos[0]?.value,
//             });
//             await user.save();
//         }
//         return done(null, user);
//     } catch (err) {
//         return done(err, null);
//     }
// }));