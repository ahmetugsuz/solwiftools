const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const bundlerAuthMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, error: 'No authentication token, access denied' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ _id: decoded.id });
    if (!user) {
      return res.status(401).json({ success: false, error: 'User not found, access denied' });
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ success: false, error: 'Please authenticate' });
  }
};

module.exports = bundlerAuthMiddleware; 