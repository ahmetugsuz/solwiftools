const express = require('express');
const router = express.Router();
const {
  createBundlerWallet,
  getBundlerWallets,
  getBundlerWallet,
  updateBundlerWallet,
  deleteBundlerWallet
} = require('../controllers/bundlerWalletController');
const bundlerAuthMiddleware = require('../middleware/bundlerAuthMiddleware');

// Create wallet
router.post('/', bundlerAuthMiddleware, createBundlerWallet);
// Get all wallets for user
router.get('/', bundlerAuthMiddleware, getBundlerWallets);
// Get wallet by id
router.get('/:id', bundlerAuthMiddleware, getBundlerWallet);
// Update wallet
router.put('/:id', bundlerAuthMiddleware, updateBundlerWallet);
// Delete wallet
router.delete('/:id', bundlerAuthMiddleware, deleteBundlerWallet);

module.exports = router; 