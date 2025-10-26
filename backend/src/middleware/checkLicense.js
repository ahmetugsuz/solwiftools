const licenseService = require('../services/licenseService');

const checkLicense = async (req, res, next) => {
  try {
    const hasAccess = await licenseService.checkDashboardAccess(  { 
      userId: req.user.id,
      wallet: req.user.wallet
      }
      );
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'No valid license found. Please purchase a license to access the dashboard.'
      });
    }
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = checkLicense; 