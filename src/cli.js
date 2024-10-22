"use strict";
const mysql = require("mysql2/promise"); // Uppdaterat från 'promise-mysql' till 'mysql2/promise'
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const moment = require('moment');
require('dotenv').config();
const QRCode = require('qrcode');
const dbConfig = require('../config/db/move.json'); // Se till att denna fil innehåller dina databasuppgifter

// Skapa en anslutningspool
const pool = mysql.createPool(dbConfig);

// Behåll 'getConnection' funktionen men uppdatera den för att använda poolen
async function getConnection() {
    try {
        const connection = await pool.getConnection();
        return connection;
    } catch (error) {
        console.error("Database connection failed:", error);
        throw error;
    }
}

// Konfigurera nodemailer för e-post
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Funktion för att skicka verifieringsmail
async function sendVerificationEmail(toEmail, token) {
    const baseUrl = process.env.BASE_URL || 'http://localhost:1338';
    const verificationLink = `${baseUrl}/verify-email?token=${token}`;
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: toEmail,
        subject: 'Verify Your Email for MoveOut',
        html: `<p>Please click on the following link to verify your email: <a href="${verificationLink}">${verificationLink}</a></p>`
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Error sending verification email:', error);
        throw new Error('Failed to send verification email.');
    }
}

// Funktion för att skapa en ny användare
async function createUser(name, email, password) {
    let connection;
    try {
        connection = await getConnection();
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const token = crypto.randomBytes(32).toString('hex');

        await connection.query(
            'INSERT INTO users (profile_name, email, password_hash, verification_token) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, token]
        );

        await sendVerificationEmail(email, token);
    } catch (error) {
        console.error('Error creating user:', error);
        throw new Error('Error creating user.');
    } finally {
        if (connection) connection.release();
    }
}

// Funktion för att verifiera användare
async function verifyUser(token) {
    let connection;
    try {
        connection = await getConnection();

        const [results] = await connection.query(
            'SELECT * FROM users WHERE verification_token = ?',
            [token]
        );

        if (results.length > 0) {
            await connection.query(
                'UPDATE users SET is_verified = TRUE, verification_token = NULL WHERE verification_token = ?',
                [token]
            );
        } else {
            throw new Error('Verification token is invalid.');
        }
    } catch (error) {
        console.error('Error verifying user:', error);
        throw new Error('Error verifying user.');
    } finally {
        if (connection) connection.release();
    }
}

// Funktion för att logga in användare
async function loginUser(email, password) {
    let connection;
    try {
        connection = await getConnection();

        const [results] = await connection.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (results.length > 0) {
            const user = results[0];
            const isValid = await bcrypt.compare(password, user.password_hash);
            if (isValid) {
                await connection.query(
                    'UPDATE users SET last_activity = CURRENT_TIMESTAMP WHERE user_id = ?',
                    [user.user_id]
                );
                return { success: true, user: { id: user.user_id, profile_name: user.profile_name } };
            } else {
                return { success: false, message: 'Invalid password.' };
            }
        } else {
            return { success: false, message: 'User not found.' };
        }
    } catch (error) {
        console.error('Error logging in:', error);
        throw new Error('Error during login.');
    } finally {
        if (connection) connection.release();
    }
}

// Funktion för att hämta alla användare
async function getAllUsers() {
    let connection;
    try {
        connection = await getConnection();
        const [users] = await connection.query('SELECT user_id, email, profile_name, is_active, last_activity, created_at FROM users');
        return users;
    } catch (error) {
        console.error("Error fetching users:", error);
        throw error;
    } finally {
        if (connection) connection.release();
    }
}

// Funktion för att aktivera en användare
async function activateUser(userId) {
    let connection;
    try {
        connection = await getConnection();
        await connection.query('UPDATE users SET is_active = TRUE WHERE user_id = ?', [userId]);
    } catch (error) {
        console.error("Error activating user:", error);
        throw error;
    } finally {
        if (connection) connection.release();
    }
}

// Funktion för att inaktivera en användare
async function deactivateUser(userId) {
    let connection;
    try {
        connection = await getConnection();
        await connection.query('UPDATE users SET is_active = FALSE WHERE user_id = ?', [userId]);
    } catch (error) {
        console.error("Error deactivating user:", error);
        throw error;
    } finally {
        if (connection) connection.release();
    }
}

// Funktion för att växla användarstatus
async function toggleUserStatus(userId) {
    let connection;
    try {
        connection = await getConnection();
        const [users] = await connection.query('SELECT is_active FROM users WHERE user_id = ?', [userId]);
        const user = users[0];
        const newStatus = !user.is_active;
        const now = new Date();
        const currentTime = moment(now).format('YYYY-MM-DD HH:mm:ss');

        await connection.query('UPDATE users SET is_active = ?, last_activity = ? WHERE user_id = ?', [
            newStatus,
            currentTime,
            userId
        ]);
    } catch (error) {
        console.error("Error toggling user status:", error);
        throw error;
    } finally {
        if (connection) connection.release();
    }
}

// Funktion för att ta bort en användare
async function deleteUser(userId) {
    let connection;
    try {
        connection = await getConnection();
        await connection.query('DELETE FROM users WHERE user_id = ?', [userId]);
    } catch (error) {
        console.error("Error deleting user:", error);
        throw error;
    } finally {
        if (connection) connection.release();
    }
}

// Funktion för att skicka marknadsföringsmail
async function sendMarketingEmails(subject, message) {
    let connection;
    try {
        connection = await getConnection();
        const [users] = await connection.query('SELECT email FROM users WHERE is_active = TRUE');

        for (const user of users) {
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: user.email,
                subject,
                text: message
            };
            try {
                await transporter.sendMail(mailOptions);
            } catch (error) {
                console.error(`Failed to send email to: ${user.email}`, error);
            }
        }
    } catch (error) {
        console.error("Error sending marketing emails:", error);
        throw error;
    } finally {
        if (connection) connection.release();
    }
}

// Funktion för att inaktivera inaktiva användare
async function deactivateInactiveUsers() {
    let connection;
    try {
        connection = await getConnection();
        const oneMonthAgo = moment().subtract(1, 'months').format('YYYY-MM-DD HH:mm:ss');

        const [usersToDeactivate] = await connection.query(
            'SELECT * FROM users WHERE last_activity < ? AND is_active = TRUE',
            [oneMonthAgo]
        );

        if (usersToDeactivate.length === 0) {
            return;
        }

        for (const user of usersToDeactivate) {
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: user.email,
                subject: 'Account Deactivation Warning',
                text: 'Your account has been inactive for a month. Please log in to avoid deactivation.'
            };

            try {
                await transporter.sendMail(mailOptions);
            } catch (err) {
                console.error(`Failed to send email to: ${user.email}`, err);
            }

            await connection.query('UPDATE users SET is_active = FALSE WHERE user_id = ?', [user.user_id]);
        }
    } catch (error) {
        console.error("Error deactivating inactive users:", error);
        throw error;
    } finally {
        if (connection) connection.release();
    }
}

// Funktion för att generera QR-kod
async function generateQRCode(text) {
    try {
        return await QRCode.toDataURL(text);
    } catch (error) {
        console.error("Error generating QR code:", error);
        throw error;
    }
}

// Funktion för att skapa en ny box
async function createBox(userId, boxName, labelName, labelImage, contentType, contentText, contentFile) {
    let connection;
    try {
        connection = await getConnection();

        // Beroende på contentType, hantera innehållet
        const contentData = contentType === 'text' ? contentText : contentFile;

        // Generera en unik access token
        const accessToken = crypto.randomBytes(16).toString('hex');

        // Spara lådan i databasen
        const [result] = await connection.query(
            'INSERT INTO boxes (user_id, box_name, label_name, label_image, content_type, content_data, access_token) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [userId, boxName, labelName, labelImage, contentType, contentData, accessToken]
        );
        const boxId = result.insertId;

        // Skapa en URL för lådan
        const baseUrl = process.env.BASE_URL || 'http://localhost:1338';
        const boxUrl = `${baseUrl}/move/boxes/qr/${accessToken}`;

        // Generera QR-koden
        const qrCodeDataUrl = await generateQRCode(boxUrl);

        // Uppdatera lådan med QR-koden
        await connection.query(
            'UPDATE boxes SET qr_code = ? WHERE box_id = ?',
            [qrCodeDataUrl, boxId]
        );

        return boxId;  // Returnera boxId så att det kan användas efter skapandet
    } catch (error) {
        console.error("Error creating box:", error);
        throw error;
    } finally {
        if (connection) connection.release();
    }
}

// Funktion för att hämta en box baserat på access token
async function getBoxByToken(accessToken) {
    let connection;
    try {
        connection = await getConnection();
        const [rows] = await connection.query('SELECT * FROM boxes WHERE access_token = ?', [accessToken]);
        return rows.length ? rows[0] : null;
    } catch (error) {
        console.error("Error fetching box by token:", error);
        throw error;
    } finally {
        if (connection) connection.release();
    }
}

// Funktion för att hämta en box baserat på ID
async function getBoxById(boxId, userId) {
    let connection;
    try {
        connection = await getConnection();
        const [rows] = await connection.query('SELECT * FROM boxes WHERE box_id = ? AND user_id = ?', [boxId, userId]);
        return rows.length ? rows[0] : null;
    } catch (error) {
        console.error("Error fetching box by ID:", error);
        throw error;
    } finally {
        if (connection) connection.release();
    }
}

// Funktion för att hämta innehållet i en box
async function getBoxContents(boxId) {
    let connection;
    try {
        connection = await getConnection();
        const [contents] = await connection.query('SELECT * FROM box_contents WHERE box_id = ?', [boxId]);
        return contents;
    } catch (error) {
        console.error("Error fetching box contents:", error);
        throw error;
    } finally {
        if (connection) connection.release();
    }
}

// Funktion för att lägga till innehåll i en box
async function addBoxContent(boxId, contentType, contentData, contentUrl) {
    let connection;
    try {
        connection = await getConnection();
        await connection.query(
            'INSERT INTO box_contents (box_id, content_type, content_data, content_url) VALUES (?, ?, ?, ?)',
            [boxId, contentType, contentData, contentUrl]
        );
    } catch (error) {
        console.error("Error adding box content:", error);
        throw error;
    } finally {
        if (connection) connection.release();
    }
}

// Funktion för att hämta alla boxar för en användare
async function getAllBoxes(userId) {
    let connection;
    try {
        connection = await getConnection();
        const [boxes] = await connection.query('SELECT * FROM boxes WHERE user_id = ?', [userId]);
        return boxes;
    } catch (error) {
        console.error("Error fetching boxes:", error);
        throw error;
    } finally {
        if (connection) connection.release();
    }
}

// Funktion för att uppdatera en box
async function updateBox(boxId, userId, boxName, labelDesign) {
    let connection;
    try {
        connection = await getConnection();
        await connection.query(
            'UPDATE boxes SET box_name = ?, label_design = ? WHERE box_id = ? AND user_id = ?',
            [boxName, labelDesign, boxId, userId]
        );
    } catch (error) {
        console.error("Error updating box:", error);
        throw error;
    } finally {
        if (connection) connection.release();
    }
}

// Funktion för att ta bort en box
async function deleteBox(boxId, userId) {
    let connection;
    try {
        connection = await getConnection();
        await connection.query('DELETE FROM boxes WHERE box_id = ? AND user_id = ?', [boxId, userId]);
    } catch (error) {
        console.error("Error deleting box:", error);
        throw error;
    } finally {
        if (connection) connection.release();
    }
}


// Funktion för att skapa eller uppdatera en etikett
async function createOrUpdateLabel(labelId, labelName, isPrivate, boxId) {
    let connection;
    try {
        connection = await getConnection();
        const pinCode = isPrivate ? generateSixDigitPin() : null;

        if (labelId) {
            // Uppdatera befintlig etikett
            await connection.query(
                'UPDATE labels SET label_name = ?, is_private = ?, pin_code = ? WHERE label_id = ?',
                [labelName, isPrivate, pinCode, labelId]
            );
        } else {
            // Skapa ny etikett
            const [result] = await connection.query(
                'INSERT INTO labels (label_name, is_private, pin_code, box_id) VALUES (?, ?, ?, ?)',
                [labelName, isPrivate, pinCode, boxId]
            );
            return result.insertId;
        }
    } catch (error) {
        console.error("Error creating/updating label:", error);
        throw error;
    } finally {
        if (connection) connection.release();
    }
}

// Funktion för att validera PIN-koden för en etikett
async function validateLabelPin(labelId, pinCode) {
    let connection;
    try {
        connection = await getConnection();
        const [rows] = await connection.query(
            'SELECT * FROM labels WHERE label_id = ? AND pin_code = ? AND is_private = TRUE',
            [labelId, pinCode]
        );

        return rows.length > 0;
    } catch (error) {
        console.error("Error validating label PIN:", error);
        throw error;
    } finally {
        if (connection) connection.release();
    }
}

// Generera sexsiffrig PIN-kod
function generateSixDigitPin() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}






// Exportera alla funktioner
module.exports = {
    // Användarfunktioner
    createUser,
    verifyUser,
    loginUser,
    getAllUsers,
    activateUser,
    deactivateUser,
    toggleUserStatus,
    deleteUser,
    sendMarketingEmails,
    sendVerificationEmail,
    deactivateInactiveUsers,

    // Boxfunktioner
    createBox,
    addBoxContent,
    getBoxById,
    getBoxByToken,
    getAllBoxes,
    getBoxContents,
    updateBox,
    deleteBox,
    

    // Övriga funktioner
    generateQRCode,
};
