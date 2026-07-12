const express = require('express');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const session = require("express-session");
const path = require('path');

const authRouter = require("./v1/modules/auth/auth.routes");
const usersRouter = require("./v1/modules/users/users.routes");
const verificationRouter = require("./v1/modules/verification/verification.routes");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(morgan("dev"));
app.use(session({
    secret: "Secret Key",
    resave: false,
    saveUninitialized: false,
}));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use(express.static(path.join(__dirname, '../public')));

// Routers
app.use("/auth", authRouter);
app.use("/users", usersRouter);
app.use("/verification", verificationRouter);

// Serve index.html for root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});


// 404 Error
app.use((req, res) => {
    res.status(404).json({
        status: "404 Not Found",
        message: "Route not found"
    });
});

// Error Handler
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(statusCode).json({
        success: false,
        message: message
    });
});


module.exports = app;