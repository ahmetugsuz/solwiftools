// src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

// Secret key for JWT (should be the same as in userController.js)
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

const authenticate = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', ''); // Get token from Authorization header

  if (!token) {
    return res.status(401).send({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET); // Verify the token
    req.user = decoded; // Attach the decoded info to the request
    next(); // Continue to the next middleware or route
  } catch (err) {
    res.status(400).send({ error: 'Invalid token' });
  }
};

module.exports = authenticate;
