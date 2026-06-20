exports.validateRegister = (data) => {
  if (!data.name || data.name.trim().length < 2) return 'Name must be at least 2 characters';
  if (!data.email || !/^\S+@\S+\.\S+$/.test(data.email)) return 'Valid email is required';
  if (!data.password || data.password.length < 6) return 'Password must be at least 6 characters';
  
  if (data.role === 'DRIVER') {
    if (!data.phone || data.phone.trim().length < 10) return 'Valid phone number is required for drivers';
    if (!data.vehicleType || data.vehicleType.trim().length === 0) return 'Vehicle type is required for drivers';
    if (!data.licensePlate || data.licensePlate.trim().length === 0) return 'License plate is required for drivers';
  }

  return null;
};

exports.validateLogin = (data) => {
  if (!data.email) return 'Email is required';
  if (!data.password) return 'Password is required';
  return null;
};

exports.validateVerifyEmail = (data) => {
  if (!data.email) return 'Email is required';
  if (!data.otp || data.otp.length !== 6) return '6-digit OTP is required';
  return null;
};
