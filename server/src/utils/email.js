const axios = require('axios');

exports.sendOtpEmail = async (to, otp, userName) => {
  // Required EmailJS environment variables
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;

  if (!serviceId || !templateId || !publicKey || !privateKey) {
    console.error('EmailJS credentials missing. Please set EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_PUBLIC_KEY, and EMAILJS_PRIVATE_KEY in your Render environment.');
    return false;
  }

  const data = {
    service_id: serviceId,
    template_id: templateId,
    user_id: publicKey,
    accessToken: privateKey,
    template_params: {
      to_email: to,
      to_name: userName,
      otp_code: otp
    }
  };

  try {
    const response = await axios.post('https://api.emailjs.com/api/v1.0/email/send', data, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('OTP email sent via EmailJS:', response.data);
    return true;
  } catch (error) {
    console.error('Error sending email via EmailJS:', error.response ? error.response.data : error.message);
    throw new Error('Failed to send verification email');
  }
};
