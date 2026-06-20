const { Resend } = require('resend');

// Resend uses HTTPS API — works on all hosting platforms including Render free tier
const resend = new Resend(process.env.RESEND_API_KEY);

// The "from" address must be either:
//   1. onboarding@resend.dev  (works immediately, for testing)
//   2. A verified domain you own (for production)
const FROM_ADDRESS = process.env.SMTP_FROM || 'CarpoolTU <onboarding@resend.dev>';

exports.sendOtpEmail = async (to, otp, userName) => {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: 'Verify your email — CarpoolTU',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9;">
          <div style="background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
            <h2 style="color: #1a1a1a; margin-top: 0;">Welcome to CarpoolTU! 🚗</h2>
            <p style="color: #555; font-size: 16px;">Hi ${userName},</p>
            <p style="color: #555; font-size: 16px;">Please use the following OTP to verify your email address. It is valid for <strong>10 minutes</strong>.</p>
            <div style="background: #fae366; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
              <h1 style="color: #1a1a1a; margin: 0; letter-spacing: 8px; font-size: 2.5rem;">${otp}</h1>
            </div>
            <p style="color: #999; font-size: 13px;">If you did not create an account, please ignore this email.</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      throw new Error('Failed to send verification email');
    }

    console.log('OTP email sent via Resend: %s', data?.id);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send verification email');
  }
};
