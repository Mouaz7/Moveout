const express = require('express');
const passport = require('passport');
const router = express.Router();

// Google OAuth-rutt
router.get('/auth/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

// Google OAuth callback-rutt
router.get('/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: '/move/login' }),
    (req, res) => {
        // När inloggning är framgångsrik
        res.redirect('/move/about');
    });

module.exports = router;
