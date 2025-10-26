// src/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const {
  loginOrRegister,
  linkWallet,
  getUserProfile,
} = require('../controllers/userController');
const authController = require('../controllers/authController');

// Combined login/registration endpoint
router.post('/auth', loginOrRegister);

// Link a new wallet to the user account
router.put('/link', linkWallet);

// Get user profile
router.get('/profile', getUserProfile);

router.get('/auth/challenge', authController.getChallenge);
router.post('/auth/verify', authController.verifySignature);

// Get user by wallet address
router.get('/by-wallet/:walletAddress', async (req, res) => {
  try {
    const walletAddress = req.params.walletAddress;
    const User = require('../models/userModel');
    const user = await User.findOne({ wallets: { $in: [walletAddress] } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Get active license for a wallet address
router.get('/active-license/:walletAddress', async (req, res) => {
  try {
    const walletAddress = req.params.walletAddress;
    const License = require('../models/License');
    const license = await License.findOne({ walletAddress, isActive: true });
    res.json({ license });
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

module.exports = router;
