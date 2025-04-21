const router = require('express').Router();
const passport = require('passport');
require('dotenv').config();
const jwt = require('jsonwebtoken')
const base64url = require('base64url');

// auth logout
router.post('/logout', (req, res) => {
    // Destroy the session
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ error: 'Failed to logout' });
        }
        
        // Clear authentication cookies
        res.clearCookie('connect.sid', { path: '/' }); // Ensure the correct path
        res.clearCookie('token', { path: '/' });

        // Send a success response
        res.status(200).json({ message: 'Logout successful' });
    });
});

// auth with google+
router.get('/google/account', passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'consent'
}));

// Callback route for Google OAuth to redirect to
router.get('/google/redirect', passport.authenticate('google'), (req, res) => {
    // Check if the user and user ID are valid
    if (!req.user || !req.user.id) {
        return res.status(400).json({ error: 'Invalid user data' });
    }

    // Generate a JWT token with a valid user ID
    const token = jwt.sign({ id: req.user.id }, process.env.JWT_SECRET, { expiresIn: '3h' });

    // Set the token in a cookie
    res.cookie('token', token, {
        
        secure: process.env.NODE_ENV === 'production', // Use only over HTTPS in production
        maxAge: 24 * 60 * 60 * 1000 // Cookie expiration
    });

    res.redirect('http://localhost:3000/');
});


// Local authentication route
router.post('/local/account', passport.authenticate('local', {
}), (req, res) => {
    // Generate a JWT token
    const token = jwt.sign({ id: req.user.id }, process.env.JWT_SECRET, { expiresIn: '3h' });

    // Set the token in a cookie
    res.cookie('token', token, {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    res.json({ token, user: req.user });
});

module.exports = router; 