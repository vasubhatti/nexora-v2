const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

/**
 * Send an email through Brevo's HTTPS API.
 *
 * This replaces Nodemailer/SMTP completely.
 * No SMTP port is used, so it works with Render Free.
 */
const sendEmail = async ({ to, toName, subject, html }) => {
  const apiKey = process.env.BREVO_API_KEY;
  const fromEmail = process.env.SMTP_FROM_EMAIL;
  const fromName = process.env.SMTP_FROM_NAME || "Nexora AI";

  if (!apiKey) {
    throw new Error("BREVO_API_KEY is not configured.");
  }

  if (!fromEmail) {
    throw new Error("SMTP_FROM_EMAIL is not configured.");
  }

  const response = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: {
        name: fromName,
        email: fromEmail,
      },
      to: [
        {
          email: to,
          name: toName || "",
        },
      ],
      subject,
      htmlContent: html,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Brevo email error:", data);

    throw new Error(
      data?.message ||
        data?.code ||
        "Failed to send email."
    );
  }

  console.log("Email sent successfully:", data.messageId);

  return data;
};

const baseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background: #0a0a0a;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI",
        Roboto, Helvetica, Arial, sans-serif;
    }

    .wrapper {
      max-width: 520px;
      margin: 40px auto;
      padding: 20px;
    }

    .card {
      background: #111111;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 16px;
      overflow: hidden;
    }

    .header {
      background: #000;
      padding: 24px 32px;
      border-bottom: 1px solid rgba(255,255,255,0.07);
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .logo {
      width: 32px;
      height: 32px;
      background: #fff;
      border-radius: 8px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      font-size: 14px;
      color: #000;
      line-height: 32px;
      text-align: center;
    }

    .brand {
      font-size: 16px;
      font-weight: 600;
      color: #fff;
      vertical-align: middle;
      margin-left: 8px;
    }

    .body {
      padding: 32px;
    }

    .title {
      font-size: 20px;
      font-weight: 700;
      color: #fff;
      margin-bottom: 12px;
    }

    .text {
      font-size: 14px;
      color: #a1a1aa;
      line-height: 1.7;
      margin-bottom: 16px;
    }

    .otp-box {
      background: #000;
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 12px;
      padding: 24px;
      text-align: center;
      margin: 24px 0;
    }

    .otp {
      font-size: 40px;
      font-weight: 800;
      color: #fff;
      letter-spacing: 14px;
      font-family: monospace;
    }

    .otp-label {
      font-size: 11px;
      color: #52525b;
      margin-top: 10px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    .btn {
      display: inline-block;
      background: #fff;
      color: #000;
      padding: 12px 28px;
      border-radius: 10px;
      text-decoration: none;
      font-weight: 700;
      font-size: 14px;
      margin: 16px 0;
    }

    .footer {
      padding: 20px 32px;
      border-top: 1px solid rgba(255,255,255,0.07);
    }

    .footer-text {
      font-size: 12px;
      color: #3f3f46;
      line-height: 1.6;
    }

    .warning {
      font-size: 12px;
      color: #52525b;
      margin-top: 12px;
    }
  </style>
</head>

<body>
  <div class="wrapper">
    <div class="card">

      <div class="header">
        <span class="logo">N</span>
        <span class="brand">Nexora AI</span>
      </div>

      <div class="body">
        ${content}
      </div>

      <div class="footer">
        <p class="footer-text">
          If you did not request this, please ignore this email.
        </p>
      </div>

    </div>
  </div>
</body>
</html>
`;

/**
 * Send OTP verification email
 */
export const sendOTPEmail = async (email, name, otp) => {
  const content = `
    <p class="title">Your verification code</p>

    <p class="text">
      Hi ${name}, enter this code to continue.
      It expires in
      <strong style="color:#fff">10 minutes</strong>.
    </p>

    <div class="otp-box">
      <div class="otp">${otp}</div>

      <div class="otp-label">
        One-time verification code · Do not share
      </div>
    </div>

    <p class="warning">
      ⚠️ Nexora AI will never ask for this code.
    </p>
  `;

  return await sendEmail({
    to: email,
    toName: name,
    subject: `${otp} — Your Nexora AI verification code`,
    html: baseTemplate(content),
  });
};

/**
 * Send forgot password email
 */
export const sendForgotPasswordEmail = async (
  email,
  name,
  resetToken
) => {
  const resetUrl =
    `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  const content = `
    <p class="title">Reset your password</p>

    <p class="text">
      Hi ${name}, click the button below to reset
      your Nexora AI password.
    </p>

    <div style="text-align:center;margin:28px 0;">
      <a href="${resetUrl}" class="btn">
        Reset Password
      </a>
    </div>

    <p
      class="text"
      style="
        font-size:12px;
        color:#52525b;
        word-break:break-all;
      "
    >
      Or copy: ${resetUrl}
    </p>

    <p class="warning">
      This link expires in 1 hour.
    </p>
  `;

  return await sendEmail({
    to: email,
    toName: name,
    subject: "Reset your Nexora AI password",
    html: baseTemplate(content),
  });
};

/**
 * Send welcome email
 */
export const sendWelcomeEmail = async (email, name) => {
  const content = `
    <p class="title">
      Welcome to Nexora AI 🎉
    </p>

    <p class="text">
      Hi ${name}, your account is ready.
      You have
      <strong style="color:#fff">100 free credits</strong>
      to explore all AI tools.
    </p>

    <div style="text-align:center;margin:28px 0;">
      <a
        href="${process.env.FRONTEND_URL}/chat"
        class="btn"
      >
        Start using Nexora AI
      </a>
    </div>
  `;

  return await sendEmail({
    to: email,
    toName: name,
    subject:
      "Welcome to Nexora AI — You have 100 free credits",
    html: baseTemplate(content),
  });
};