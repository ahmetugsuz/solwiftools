const express = require('express');
const router = express.Router();
const {
  createBundlerBundle,
  getBundlerBundles,
  getBundlerBundle,
  updateBundlerBundle,
  deleteBundlerBundle,
  executeBundlerBundle
} = require('../controllers/bundlerBundleController');
const bundlerAuthMiddleware = require('../middleware/bundlerAuthMiddleware');

// Create bundle
router.post('/', bundlerAuthMiddleware, createBundlerBundle);
// Get all bundles for user
router.get('/', bundlerAuthMiddleware, getBundlerBundles);
// Get bundle by id
router.get('/:id', bundlerAuthMiddleware, getBundlerBundle);
// Update bundle
router.put('/:id', bundlerAuthMiddleware, updateBundlerBundle);
// Delete bundle
router.delete('/:id', bundlerAuthMiddleware, deleteBundlerBundle);
// Execute bundle
router.post('/:id/execute', bundlerAuthMiddleware, executeBundlerBundle);

module.exports = router; 