const express = require('express');
const router = express.Router();
const licenseService = require('../services/licenseService');
const auth = require('../middlewares/authMiddleware');

router.post('/purchase', auth, async (req, res) => {
  try {
    const { type, walletAddress, transactionHash, email } = req.body;
    const license = await licenseService.createLicense({
      userId: req.user.id,
      type,
      walletAddress,
      transactionHash,
      email
    });
    
    res.json({
      success: true,
      license
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/validate/:licenseId', auth, async (req, res) => {
  try {
    const result = await licenseService.validateLicense(req.params.licenseId);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/dashboard/access', auth, async (req, res) => {
  try {
    const hasAccess = await licenseService.checkDashboardAccess({
      wallet: req.user.wallet,
      userId: req.user.id
    });    
    res.json({ hasAccess });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router; 