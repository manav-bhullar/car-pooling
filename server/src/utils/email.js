const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT, 10),
  secure: false, // true for 465, false for other ports
  family: 4,     // Force IPv4 — Render free tier blocks outbound IPv6
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

exports.sendOtpEmail = async (to, otp, userName) => {
  const mailOptions = {
    from: process.env.SMTP_FROM || '"Carpool App" <noreply@carpool.com>',
    to,
    subject: 'Verify your email - Carpool App',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Welcome to Carpool App!</h2>
        <p>Hi ${userName},</p>
        <p>Please use the following OTP to verify your email address. It is valid for 10 minutes.</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
          <h1 style="color: #333; margin: 0; letter-spacing: 5px;">${otp}</h1>
        </div>
        <p>If you did not request this, please ignore this email.</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('OTP email sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send verification email');
  }
};
