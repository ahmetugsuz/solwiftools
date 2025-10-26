const BundlerWallet = require('../models/BundlerWalletModel');

// Create a new wallet
const createBundlerWallet = async (req, res) => {
  try {
    const walletData = req.body;
    walletData.owner = req.user.id;
    const wallet = new BundlerWallet(walletData);
    await wallet.save();
    res.status(201).json({ success: true, wallet });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get all wallets for user
const getBundlerWallets = async (req, res) => {
  try {
    const wallets = await BundlerWallet.find({ owner: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, wallets });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get wallet by id
const getBundlerWallet = async (req, res) => {
  try {
    const wallet = await BundlerWallet.findOne({ _id: req.params.id, owner: req.user.id });
    if (!wallet) return res.status(404).json({ success: false, error: 'Wallet not found' });
    res.json({ success: true, wallet });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update wallet (e.g., label, isSelected, balance)
const updateBundlerWallet = async (req, res) => {
  try {
    const wallet = await BundlerWallet.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.id },
      req.body,
      { new: true }
    );
    if (!wallet) return res.status(404).json({ success: false, error: 'Wallet not found' });
    res.json({ success: true, wallet });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete wallet
const deleteBundlerWallet = async (req, res) => {
  try {
    const wallet = await BundlerWallet.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
    if (!wallet) return res.status(404).json({ success: false, error: 'Wallet not found' });
    res.json({ success: true, message: 'Wallet deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  createBundlerWallet,
  getBundlerWallets,
  getBundlerWallet,
  updateBundlerWallet,
  deleteBundlerWallet
}; 