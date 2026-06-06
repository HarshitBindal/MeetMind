const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect routes — only authenticated users can access.
 * Reads the JWT from the Authorization header (Bearer <token>),
 * verifies it, finds the user, and attaches it to req.user.
 */
const protect = async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Extract token from "Bearer <token>"
      token = req.headers.authorization.split(' ')[1];

      // Verify the token and extract the user ID
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find user by ID and exclude password from the result
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        res.status(401);
        throw new Error('User not found');
      }

      next();
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

module.exports = { protect };
