const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const LocalStrategy = require('passport-local').Strategy
const crypto = require('crypto');
require('dotenv').config();
const bcrypt = require('bcrypt');
const pool = require('../db');

// Serialize the user into the session
passport.serializeUser((user, done) => {
    done(null, user.id);  // Here, user.id will be stored in the session
});

// Deserialize the user out of the session
passport.deserializeUser(async (id, done) => {
    try {
        const res = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        done(null, res.rows[0]); // Attach the full user object to req.user
    } catch (err) {
        done(err, null);
    }
});

// Google OAuth Strategy
passport.use(
    new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID, // Use environment variable
        clientSecret: process.env.GOOGLE_CLIENT_SECRET, // Use environment variable
        callbackURL: "http://localhost:1700/auth/google/redirect",
        prompt: 'select_account', // Forces Google to always prompt the account selection
        scope: ['openid', 'email', 'profile'], // Add required scopes here
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            // Check if the user already exists
            const existingUser = await pool.query(
                'SELECT * FROM users WHERE google_id = $1 OR email = $2', 
                [profile.id, profile.emails[0].value]
            );

            if (existingUser.rows.length > 0) {
                // If user exists, pass the user to Passport
                done(null, existingUser.rows[0]);
            } else {
                // If user doesn't exist, create a new user
                const randomPassword = crypto.randomBytes(16).toString('hex');
                const newUser = await pool.query(
                    'INSERT INTO users (google_id, email, password, nickname) VALUES ($1, $2, $3, $4) RETURNING *',
                    [profile.id, profile.emails[0].value, randomPassword, profile.displayName]
                );
                done(null, newUser.rows[0]);
            }
        } catch (err) {
            done(err, null);
        }
    })
);

// Local Strategy
passport.use(
    new LocalStrategy(
        { usernameField: "email", passwordField: "password" },
        async (email, password, done) => {
            try {
                const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
                console.log(email, password)

                if (result.rows.length === 0) {
                    console.log("User not found");
                    return done(null, false, { message: "No User With That Email Address" });
                }

                const user = result.rows[0];
                console.log("User found:", user);

                const isMatch = await bcrypt.compare(password, user.password);
                if (!isMatch) {
                    console.log("Incorrect password");
                    return done(null, false, { message: "Password is Incorrect" });
                }

                console.log("Authentication successful");
                return done(null, user);
            } catch (err) {
                console.error("Error in authentication:", err);
                return done(err);
            }
        }
    )
);