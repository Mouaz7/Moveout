"use strict";
const mysql = require('promise-mysql');
const dbConfig = require('../config/db/move.json');

// Funktion för att ansluta till databasen
async function getConnection() {
    try {
        return await mysql.createConnection(dbConfig);
    } catch (error) {
        console.error("Database connection failed:", error);
        throw error;
    }
}

// Middleware för att kontrollera om användaren är administratör
async function isAdmin(req, res, next) {
    if (req.session.user) {
        // Om admin-status redan finns i sessionen, fortsätt
        if (req.session.user.isAdmin) {
            return next(); // Fortsätt om användaren är admin
        }

        // Om admin-status inte är satt i sessionen, hämta från databasen
        try {
            const connection = await getConnection();
            const [user] = await connection.query('SELECT is_admin FROM users WHERE user_id = ?', [req.session.user.id]);
            
            if (user && user.is_admin) {
                req.session.user.isAdmin = true; // Sätt adminstatus i sessionen
                return next();
            } else {
                // Skicka ett tydligt textmeddelande utan att skapa en ny vy
                return res.status(403).send('<h1>Access Denied</h1><p>You are not an admin.</p>');
            }
        } catch (error) {
            console.error("Error checking admin status:", error);
            return res.status(500).send('<h1>Server Error</h1><p>An error occurred while checking admin status.</p>');
        }
    } else {
        // Om ingen användare är inloggad, returnera ett textmeddelande
        return res.status(403).send('<h1>Access Denied</h1><p>Please log in.</p>');
    }
}

module.exports = isAdmin;
