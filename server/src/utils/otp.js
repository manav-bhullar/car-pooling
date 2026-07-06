const crypto = require('crypto');

exports.generateOtp = () => {
  // Generate a cryptographically secure 6-digit number
  return crypto.randomInt(100000, 1000000).toString();
};

exports.isOtpExpired = (expiresAt) => {
  return new Date() > new Date(expiresAt);
};
