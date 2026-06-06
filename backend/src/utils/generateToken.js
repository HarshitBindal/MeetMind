const jwt = require('jsonwebtoken');

/**
 * Generate a signed JWT token for a user.
 * The token embeds the user's MongoDB _id and expires in 30 days.
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

module.exports = generateToken;
