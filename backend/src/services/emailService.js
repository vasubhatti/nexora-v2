import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const baseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .wrapper { max-width: 520px; margin: 40px auto; padding: 20px; }
    .card { background: #111111; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; overflow: hidden; }
    .header { background: #000; padding: 28px 32px; border-bottom: 1px solid rgba(255,255,255,0.07); display: flex; align-items: center; gap: 12px; }
    .logo { width: 32px; height: 32px; background: #fff; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 14px; color: #000; }
    .brand { font-size: 16px; font-weight: 600; color: #fff; }
    .body { padding: 32px; }
    .title { font-size: 20px; font-weight: 700; color: #fff; margin-bottom: 12px; }
    .text { font-size: 14px; color: #a1a1aa; line-height: 1.7; margin-bottom: 20px; }
    .otp-box { background: #000; border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
    .otp { font-size: 36px; font-weight: 800; color: #fff; letter-spacing: 12px; font-family: monospace; }
    .otp-label { font-size: 11px; color: #52525b; margin-top: 8px; text-transform: uppercase; letter-spacing: 0.08em; }
    .btn { display: inline-block; background: #fff; color: #000; padding: 12px 28px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 14px; margin: 16px 0; }
    .footer { padding: 20px 32px; border-top: 1px solid rgba(255,255,255,0.07); }
    .footer-text { font-size: 12px; color: #3f3f46; line-height: 1.6; }
    .warning { font-size: 12px; color: #52525b; margin-top: 12px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <div class="logo">N</div>
        <span class="brand">Nexora AI</span>
      </div>
      <div class="body">${content}</div>
      <div class="footer">
        <p class="footer-text">This email was sent by Nexora AI. If you did not request this, please ignore this email.</p>
      </div>
    </div>
  </div>
</body>
</html>`;

export const sendOTPEmail = async (email, name, otp) => {
  const content = `
    <p class="title">Your verification code</p>
    <p class="text">Hi ${name}, enter this code to complete your sign in. It expires in <strong style="color:#fff">10 minutes</strong>.</p>
    <div class="otp-box">
      <div class="otp">${otp}</div>
      <div class="otp-label">One-time verification code</div>
    </div>
    <p class="warning">⚠️ Never share this code with anyone. Nexora AI will never ask for it.</p>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: `${otp} — Your Nexora AI verification code`,
    html: baseTemplate(content),
  });
};

export const sendForgotPasswordEmail = async (email, name, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  const content = `
    <p class="title">Reset your password</p>
    <p class="text">Hi ${name}, we received a request to reset your Nexora AI password. Click the button below to choose a new password.</p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${resetUrl}" class="btn">Reset Password</a>
    </div>
    <p class="text" style="font-size: 12px; color: #52525b;">
      Or copy this link: <span style="color: #a1a1aa; word-break: break-all;">${resetUrl}</span>
    </p>
    <p class="warning">This link expires in 1 hour. If you did not request a password reset, ignore this email.</p>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: "Reset your Nexora AI password",
    html: baseTemplate(content),
  });
};

export const sendWelcomeEmail = async (email, name) => {
  const content = `
    <p class="title">Welcome to Nexora AI 🎉</p>
    <p class="text">Hi ${name}, your account is ready. You have <strong style="color:#fff">100 free credits</strong> to explore all AI tools.</p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${process.env.FRONTEND_URL}/chat" class="btn">Start using Nexora AI</a>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: "Welcome to Nexora AI — You have 100 free credits",
    html: baseTemplate(content),
  });
};