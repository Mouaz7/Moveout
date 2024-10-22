"use strict";
const express = require('express');
const router = express.Router();
const cli = require('../src/cli'); // Importera CLI-modulen
const isAdmin = require('../middleware/isAdmin'); // Kontrollera adminstatus
const moment = require('moment');

// Route för att visa alla användare (inklusive lagringsanvändning)
router.get('/users', isAdmin, async (req, res) => {
    const user = req.session.user;
    try {
        const users = await cli.getAllUsers(); // Hämta användarna med last_activity och created_at
        res.render('adminUsers', {
            users,
            showDashboard: false,
            errorMessage: null,
            successMessage: req.query.successMessage || null,
            user,
            title: 'Admin Panel - Manage Users'
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.render('adminUsers', {
            users: [],
            showDashboard: false,
            errorMessage: 'Error fetching users.',
            successMessage: null,
            user,
            title: 'Admin Panel - Manage Users'
        });
    }
});

// Route för admin dashboard
router.get('/user', isAdmin, (req, res) => {
    const user = req.session.user;
    if (user && user.isAdmin) {
        res.render('adminUsers', {
            showDashboard: true,
            errorMessage: null,
            successMessage: null,
            user,
            title: 'Admin Dashboard'
        });
    } else {
        res.status(403).send('<h1>Access Denied</h1><p>You do not have access to the admin dashboard.</p>');
    }
});

// Route för att ta bort en användare
router.post('/delete', isAdmin, async (req, res) => {
    const userId = req.body.user_id;
    try {
        await cli.deleteUser(userId); // Använder funktionen från cli.js för att ta bort användaren
        res.redirect('/move/admin/users?successMessage=User deleted successfully');
    } catch (error) {
        console.error("Error deleting user:", error);
        const users = await cli.getAllUsers();
        res.render('adminUsers', {
            users,
            showDashboard: false,
            errorMessage: 'Error deleting user.',
            successMessage: null,
            user: req.session.user,
            title: 'Admin Panel - Manage Users'
        });
    }
});

// Route för att aktivera/inaktivera användare
router.post('/toggle-status', isAdmin, async (req, res) => {
    const userId = req.body.user_id;
    try {
        await cli.toggleUserStatus(userId); // Växla användarens status
        res.redirect('/move/admin/users?successMessage=User status updated');
    } catch (error) {
        console.error("Error toggling user status:", error);
        const users = await cli.getAllUsers();
        res.render('adminUsers', {
            users,
            showDashboard: false,
            errorMessage: 'Error toggling user status.',
            successMessage: null,
            user: req.session.user,
            title: 'Admin Panel - Manage Users'
        });
    }
});

// Route för att skicka marknadsföringsmejl
router.post('/send-marketing', isAdmin, async (req, res) => {
    const { subject, message } = req.body;
    const user = req.session.user;
    try {
        await cli.sendMarketingEmails(subject, message); // Skicka mejl
        res.redirect('/move/admin/users?successMessage=Marketing emails sent successfully');
    } catch (error) {
        console.error("Error sending marketing emails:", error);
        res.render('adminUsers', {
            users: [],
            showDashboard: true,
            errorMessage: 'Error sending marketing emails.',
            successMessage: null,
            user,
            title: 'Admin Panel - Send Marketing Emails'
        });
    }
});

// Automatisk avaktivering av användare efter en månads inaktivitet
router.get('/deactivate-inactive', isAdmin, async (req, res) => {
    try {
        await cli.deactivateInactiveUsers(); // Hantera inaktivering
        res.redirect('/move/admin/users?successMessage=Inactive users deactivated successfully');
    } catch (error) {
        console.error("Error deactivating inactive users:", error);
        res.render('adminUsers', {
            users: [],
            showDashboard: true,
            errorMessage: 'Error deactivating inactive users.',
            successMessage: null,
            user: req.session.user,
            title: 'Admin Panel - Manage Users'
        });
    }
});




module.exports = router;
