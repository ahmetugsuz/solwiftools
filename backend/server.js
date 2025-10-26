const express = require('express');
const cors = require('cors');
const multer = require('multer');
const upload = multer();
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const path = require('path');
const userRoutes = require('./src/routes/userRoutes');    // Updated path
const tokenRoutes = require('./src/routes/tokenRoutes');  // Updated path
const liquidityRoutes = require('./src/routes/liquidityRoutes');
const licenseRoutes = require('./src/routes/licenseRoutes');

// Load environment variables
require("dotenv").config();

const app = express();

// Middleware setup
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));

// Add request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Add this before your routes
app.use((req, res, next) => {
    const oldSend = res.send;
    res.send = function (data) {
        console.log(`Response for ${req.method} ${req.url}:`, data);
        oldSend.apply(res, arguments);
    };
    next();
});

// MongoDB Connection with better error handling
const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
    console.error('MONGODB_URI is not defined in environment variables');
    process.exit(1);
}

mongoose
    .connect(mongoUri, { 
        useNewUrlParser: true, 
        useUnifiedTopology: true 
    })
    .then(() => console.log('MongoDB connected successfully!'))
    .catch((err) => {
        console.error('MongoDB connection error:', err.message);
        process.exit(1);
    });

// Add this before your routes
console.log('Setting up routes...');

// Routes with logging
app.use('/api/tokens', tokenRoutes);
console.log('Token routes registered at /api/tokens');

app.use('/api/users', userRoutes);
app.use('/api/user', userRoutes); // Alias for singular
console.log('User routes registered at /api/users and /api/user');

app.use('/api/liquidity', liquidityRoutes);
console.log('Liquidity routes registered at /api/liquidity');

// Bundler Section routes
app.use('/api/bundler/tokens', require('./src/routes/bundlerTokenRoutes'));
app.use('/api/bundler/wallets', require('./src/routes/bundlerWalletRoutes'));
app.use('/api/bundler/bundles', require('./src/routes/bundlerBundleRoutes'));

// License routes
app.use('/api/license', licenseRoutes);
console.log('License routes registered at /api/license');

// Health Check Endpoint
app.get('/', (req, res) => {
    res.send('CoinCraft Backend is running!');
});

// 404 Handler for Undefined Routes
app.use((req, res, next) => {
    res.status(404).send({ error: 'Route not found' });
});

// Modified Global Error Handler
app.use((err, req, res, next) => {
    console.error('Error occurred during request:', {
        method: req.method,
        url: req.url,
        error: err.message,
        stack: err.stack
    });

    res.status(500).json({
        success: false,
        error: 'Failed to process request',
        details: err.message
    });
});

// Add this to handle uncaught exceptions
process.on('uncaughtException', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.log(`Port ${process.env.PORT || 5050} is busy. Trying to close existing connection...`);
        require('child_process').exec(`lsof -i tcp:${process.env.PORT || 5050} | grep LISTEN | awk '{print $2}' | xargs kill -9`);
        console.log('Please restart the server.');
        process.exit(1);
    } else {
        console.error('Uncaught Exception:', error);
        process.exit(1);
    }
});
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
    // Keep the server running despite the error
});

// Start Server
const port = process.env.PORT || 5050;
const server = app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use`);
        process.exit(1);
    } else {
        console.error('Server error:', err);
    }
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

app.use(cors());

