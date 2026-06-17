const crypto = require('crypto');

exports.generateOtp = () => {
  // Generate a random 6-digit number
  return Math.floor(100000 + Math.random() * 900000).toString();
};

exports.isOtpExpired = (expiresAt) => {
  return new Date() > new Date(expiresAt);
};
