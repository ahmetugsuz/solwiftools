const BundlerBundle = require('../models/BundlerBundleModel');

// Create a new bundle
const createBundlerBundle = async (req, res) => {
  try {
    const bundleData = req.body;
    bundleData.createdBy = req.user.id;
    const bundle = new BundlerBundle(bundleData);
    await bundle.save();
    res.status(201).json({ success: true, bundle });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get all bundles for user
const getBundlerBundles = async (req, res) => {
  try {
    const bundles = await BundlerBundle.find({ createdBy: req.user.id })
      .populate('token wallets')
      .sort({ createdAt: -1 });
    res.json({ success: true, bundles });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get bundle by id
const getBundlerBundle = async (req, res) => {
  try {
    const bundle = await BundlerBundle.findOne({ _id: req.params.id, createdBy: req.user.id })
      .populate('token wallets');
    if (!bundle) return res.status(404).json({ success: false, error: 'Bundle not found' });
    res.json({ success: true, bundle });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update bundle
const updateBundlerBundle = async (req, res) => {
  try {
    const bundle = await BundlerBundle.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      req.body,
      { new: true }
    );
    if (!bundle) return res.status(404).json({ success: false, error: 'Bundle not found' });
    res.json({ success: true, bundle });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete bundle
const deleteBundlerBundle = async (req, res) => {
  try {
    const bundle = await BundlerBundle.findOneAndDelete({ _id: req.params.id, createdBy: req.user.id });
    if (!bundle) return res.status(404).json({ success: false, error: 'Bundle not found' });
    res.json({ success: true, message: 'Bundle deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Execute bundle (simulate transaction)
const executeBundlerBundle = async (req, res) => {
  try {
    const bundle = await BundlerBundle.findOne({ _id: req.params.id, createdBy: req.user.id });
    if (!bundle) return res.status(404).json({ success: false, error: 'Bundle not found' });
    if (bundle.status !== 'pending') return res.status(400).json({ success: false, error: 'Bundle not in pending status' });
    // Simulate execution
    bundle.status = 'executed';
    bundle.transactionHash = 'SIMULATED_HASH_' + Date.now();
    bundle.executedAt = new Date();
    await bundle.save();
    res.json({ success: true, message: 'Bundle executed', bundle });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  createBundlerBundle,
  getBundlerBundles,
  getBundlerBundle,
  updateBundlerBundle,
  deleteBundlerBundle,
  executeBundlerBundle
}; 