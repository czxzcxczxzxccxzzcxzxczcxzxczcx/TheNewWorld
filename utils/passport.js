const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { User } = require('./database');
const crypto = require('crypto');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: 'https://tnw-axbycee9gmd6htb0.canadacentral-01.azurewebsites.net/api/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
            // Generate a unique account number
            let accountNumber;
            let userExists = true;
            while (userExists) {
                accountNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();
                const existingUser = await User.findOne({ accountNumber });
                if (!existingUser) userExists = false;
            }

            // Validate username: only allow alphanumeric and underscores
            let baseUsername = (profile.displayName || 'user').replace(/[^\w]/g, '');
            if (!baseUsername) baseUsername = 'user';

            // Ensure username is unique
            let finalUsername = baseUsername;
            let suffix = 1;
            while (await User.findOne({ username: finalUsername })) {
                finalUsername = `${baseUsername}${suffix}`;
                suffix++;
            }

            user = new User({
                googleId: profile.id,
                username: finalUsername,
                accountNumber,
                pfp: profile.photos && profile.photos[0] ? profile.photos[0].value : undefined,
            });
            await user.save();
        }
        return done(null, user);
    } catch (err) {
        return done(err, null);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

module.exports = passport;
