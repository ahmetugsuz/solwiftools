const mongoose = require('mongoose');

// Define the user schema
const userSchema = new mongoose.Schema({
    email: { type: String, required: false, unique: false, sparse: true, default: null }, // Optional for backup login
    wallets: { type: [String], required: false }, // Array of wallet addresses (strings)
    name: { type: String, required: false },
    license: { type: Object, default: null },
    createdAt: { type: Date, default: Date.now }
}, {
    timestamps: true // Automatically add createdAt and updatedAt fields
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema); 