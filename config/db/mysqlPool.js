// config/db/mysqlPool.js

const mysql = require('mysql2/promise');
require('dotenv').config(); // Laddar miljövariabler från .env-filen

// Kontrollera att alla nödvändiga miljövariabler är definierade
if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_NAME) {
  throw new Error('Viktiga databasinställningar saknas i miljövariablerna.');
}

// Skapa MySQL-anslutningspool med konfiguration från miljövariabler
const pool = mysql.createPool({
  host: process.env.DB_HOST,        // Databasvärd
  user: process.env.DB_USER,        // Databasanvändare
  password: process.env.DB_PASSWORD, // Databaslösenord
  database: process.env.DB_NAME,    // Databasnamn
  waitForConnections: true,
  connectionLimit: 10,              // Begränsar antalet anslutningar i poolen
  queueLimit: 0,                    // Obegränsad kö för väntande anslutningar
  connectTimeout: 10000             // Timeout (10 sekunder)
});

module.exports = pool;
