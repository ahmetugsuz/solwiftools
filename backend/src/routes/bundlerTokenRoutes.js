const express = require('express');
const router = express.Router();
const { 
  createBundlerToken,
  getBundlerTokens,
  getBundlerToken,
  updateBundlerToken,
  deleteBundlerToken,
  launchBundlerToken,
  prepareLaunch,
  prepareLaunchLogs,
  triggerPrepareLaunch,
  previewVanityAddresses
} = require('../controllers/bundlerTokenController');
const bundlerAuthMiddleware = require('../middleware/bundlerAuthMiddleware');

// Create token
router.post('/', bundlerAuthMiddleware, createBundlerToken);
// Get all tokens for user
router.get('/', bundlerAuthMiddleware, getBundlerTokens);
// Get token by id
router.get('/:id', bundlerAuthMiddleware, getBundlerToken);
// Update token
router.put('/:id', bundlerAuthMiddleware, updateBundlerToken);
// Delete token
router.delete('/:id', bundlerAuthMiddleware, deleteBundlerToken);
// Launch token
router.post('/:id/launch', bundlerAuthMiddleware, launchBundlerToken);
// Prepare launch (POST with token info)
router.post('/:id/prepare-launch', bundlerAuthMiddleware, prepareLaunch);
// Stream logs for prepare launch (SSE)
router.get('/prepare-launch/logs/:prepId', bundlerAuthMiddleware, prepareLaunchLogs);
// Trigger on-demand sequential buys
router.post('/prepare-launch/trigger/:prepId', bundlerAuthMiddleware, triggerPrepareLaunch);
// Preview vanity addresses
router.post('/preview-vanity', bundlerAuthMiddleware, previewVanityAddresses);

module.exports = router; 