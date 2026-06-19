const { Resend } = require('resend');

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

const sendVerificationEmail = async (to, code, username) => {
  try {
    // Use resend.dev test domain for development (no verification needed!)
    // For production, replace with your verified domain: noreply@yourdomain.com
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

    const { data, error } = await resend.emails.send({
      from: `StrayzilBase <${fromEmail}>`,
      to: [to],
      subject: 'Verify Your StrayzilBase Account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #0a0a0f; color: #fff;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #3b82f6; margin: 0;">StrayzilBase</h1>
            <p style="color: #9ca3af; margin: 5px 0 0;">Minecraft Experiment Platform</p>
          </div>

          <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 30px; border: 1px solid rgba(255,255,255,0.1);">
            <h2 style="margin-top: 0; color: #fff;">Hello, ${username}!</h2>
            <p style="color: #9ca3af; line-height: 1.6;">Thank you for joining StrayzilBase. To complete your registration, please use the verification code below:</p>

            <div style="text-align: center; margin: 30px 0;">
              <div style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #06b6d4); padding: 20px 40px; border-radius: 12px; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #fff;">
                ${code}
              </div>
            </div>

            <p style="color: #9ca3af; font-size: 14px; text-align: center;">This code expires in 24 hours.</p>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1);">
              <p style="color: #6b7280; font-size: 12px; margin: 0;">If you didn't create this account, you can safely ignore this email.</p>
            </div>
          </div>

          <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px;">
            <p>© 2026 StrayzilBase. All rights reserved.</p>
          </div>
        </div>
      `
    });

    if (error) {
      console.error('Resend email error:', error);
      throw new Error(error.message);
    }

    console.log('Verification email sent:', data?.id);
    return data;
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
};

const sendPasswordResetEmail = async (to, resetToken, username) => {
  try {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

    const { data, error } = await resend.emails.send({
      from: `StrayzilBase <${fromEmail}>`,
      to: [to],
      subject: 'Reset Your StrayzilBase Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #0a0a0f; color: #fff;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #3b82f6; margin: 0;">StrayzilBase</h1>
          </div>

          <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 30px; border: 1px solid rgba(255,255,255,0.1);">
            <h2 style="margin-top: 0; color: #fff;">Password Reset Request</h2>
            <p style="color: #9ca3af; line-height: 1.6;">Hello ${username}, we received a request to reset your password. Click the button below to reset it:</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #06b6d4); padding: 15px 30px; border-radius: 8px; color: #fff; text-decoration: none; font-weight: bold;">
                Reset Password
              </a>
            </div>

            <p style="color: #9ca3af; font-size: 14px;">Or copy this link: <span style="color: #3b82f6;">${resetUrl}</span></p>
            <p style="color: #6b7280; font-size: 12px;">This link expires in 1 hour.</p>
          </div>
        </div>
      `
    });

    if (error) {
      console.error('Resend email error:', error);
      throw new Error(error.message);
    }

    console.log('Password reset email sent:', data?.id);
    return data;
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail
};
