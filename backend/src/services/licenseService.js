const License = require('../models/License');
const crypto = require('crypto');

class LicenseService {
  generateLicenseId() {
    return crypto.randomBytes(16).toString('hex');
  }

  async createLicense(data) {
    const { userId, type, walletAddress, transactionHash, email } = data;
    // Deactivate any existing active license for this wallet
    await License.updateMany({ walletAddress, isActive: true }, { $set: { isActive: false } });
    let licenseId;
    const startDate = new Date();
    let expiryDate = null;
    if (type === 'LIFETIME') {
      licenseId = `lifetime-${walletAddress}`;
    } else if (type === 'RENTAL') {
      expiryDate = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes for rental
      licenseId = `rental-${walletAddress}-${Date.now()}`;
    } else {
      throw new Error('Invalid license type');
    }
    const license = new License({
      userId,
      licenseId,
      type,
      walletAddress,
      transactionHash,
      startDate,
      expiryDate,
      email
    });
    await license.save();
    return license;
  }

  async validateLicense(licenseId) {
    const license = await License.findOne({ licenseId });
    if (!license) return { isValid: false, message: 'License not found' };
    
    const isValid = license.isValid();
    return {
      isValid,
      type: license.type,
      message: isValid ? 'License is valid' : 'License has expired'
    };
  }

  async getUserLicenses(userId) {
    return await License.find({ userId });
  }

  async checkDashboardAccess({ userId, wallet }) {
    const query = wallet
      ? { walletAddress: wallet, isActive: true }
      : { userId, isActive: true };
  
    const licenses = await License.find(query);
    const validLicense = licenses.find(license => typeof license.isValid === 'function' && license.isValid());
    return !!validLicense;
  }
  
  
}

module.exports = new LicenseService(); 