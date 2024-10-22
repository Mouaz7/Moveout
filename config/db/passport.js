const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const mysql = require('promise-mysql');
const dbConfig = require('./mysqlPool');  // Lokal sökväg

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
},


async (accessToken, refreshToken, profile, done) => {
    try {
        const db = await mysql.createConnection(dbConfig);
        const users = await db.query('SELECT * FROM users WHERE email = ?', [profile.emails[0].value]);

        if (users.length > 0) {
            return done(null, users[0]);
        } else {
            const newUser = {
                email: profile.emails[0].value,
                profile_name: profile.displayName,
                is_verified: true
            };
            const result = await db.query('INSERT INTO users (email, profile_name, is_verified) VALUES (?, ?, ?)', 
                                          [newUser.email, newUser.profile_name, newUser.is_verified]);
            newUser.user_id = result.insertId;
            return done(null, newUser);
        }
    } catch (error) {
        return done(error, false);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user.user_id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const db = await mysql.createConnection(dbConfig);
        const users = await db.query('SELECT * FROM users WHERE user_id = ?', [id]);
        done(null, users[0]);
    } catch (error) {
        done(error, false);
    }
});

module.exports = passport;
