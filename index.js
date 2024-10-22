"use strict";
const express = require("express");
const session = require("express-session");
const path = require("path");
const port = 1338;  // Fixed port
const app = express();
const indexRoutes = require("./routes/indexRoutes.js");
const adminRoutes = require('./middleware/adminRoutes');
const cli = require('./src/cli');  // Added cli for deactivation job
require('dotenv').config();
const cron = require('node-cron');  // Added node-cron
const authRoutes = require('./routes/authRoutes'); 
const passport = require('passport');
require('./config/db/passport');




// **Add required modules for session store**
const MySQLStore = require('express-mysql-session')(session);
const dbConfig = require('./config/db/move.json'); // Adjust the path as needed

// **Set up the session store**
const sessionStore = new MySQLStore({
    host: dbConfig.host,
    port: dbConfig.port || 3306,
    user: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.database
});

// **Add session handling to the app**
app.use(session({
  secret: process.env.SESSION_SECRET || 'fvqvqkhtzncccqut',  // Fixed session secret
  resave: false,
  saveUninitialized: false,  // Only create sessions when necessary
  store: sessionStore,       // **Use the MySQL session store**
  cookie: { 
      secure: false,  // Change to true if using HTTPS in production
      httpOnly: true, // Make cookie accessible only to the server, not client JS
      maxAge: 7 * 24 * 60 * 60 * 1000  // **Cookie valid for 7 days**
  }
}));

// Middleware för Passport
app.use(passport.initialize());
app.use(passport.session());

// Middleware to handle static files (CSS, JS, images, etc.)
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Middleware to handle form data and JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(authRoutes); // Add the authRoutes to the app

// Set the path to views
app.set('views', path.join(__dirname, 'views/pages'));
// Set the view engine to EJS
app.set("view engine", "ejs");

// Log all incoming requests
app.use((req, res, next) => {
    console.log(`${new Date().toLocaleString()} - ${req.method} ${req.url}`);
    next();
});

// Make the session available in all views (EJS)
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;  // If no session, set user to null
  next();
});

// Use routes from indexRoutes.js
app.use("/move", indexRoutes);
app.use('/move/admin', adminRoutes);  

// Handle 404 errors
app.use((req, res, next) => {
  res.status(404).render('error', { 
    title: '404 - Not Found', 
    message: 'Page not found', 
    user: req.session ? req.session.user : null 
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error("Global error handler:", err.stack);
  const user = req.session ? req.session.user : null;  // If session exists
  res.status(500).render("error", { 
      title: 'Error - MoveOut',  // Add title
      message: 'Internal Server Error',  // Define message here
      user  // Make user info available in the view
  });
});

// Schedule deactivation of inactive accounts once a day
cron.schedule('0 0 * * *', async () => {  // Runs every day at 00:00
  try {
      console.log("Running automatic deactivation of inactive accounts...");
      await cli.deactivateInactiveUsers();
      console.log("Automatic deactivation of inactive accounts completed.");
  } catch (error) {
      console.error("Error during automatic deactivation of inactive accounts:", error);
  }
});

// Start the server and listen on a fixed port
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}/move`);
});
