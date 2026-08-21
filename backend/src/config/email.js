const nodemailer = require("nodemailer");
const { env } = require("./env");

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (!env.smtp.host || !env.smtp.user) {
    // No SMTP configured — this is expected in dev/test unless someone
    // has deliberately set up a mail provider. Emails will be logged
    // instead of sent (see sendEmail below).
    return null;
  }

  transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.port === 465,
    auth: { user: env.smtp.user, pass: env.smtp.pass },
  });

  return transporter;
}

// Never throws — a failed email should not break the request that
// triggered it (same philosophy as notifications). Falls back to
// logging the email to the console when SMTP isn't configured, which
// is genuinely useful in dev: you can see the reset link without
// needing a real mail provider set up.
async function sendEmail({ to, subject, html }) {
  const t = getTransporter();

  if (!t) {
    console.log(`\n📧 [DEV EMAIL — SMTP not configured, logging instead]`);
    console.log(`To: ${to}\nSubject: ${subject}\n${html}\n`);
    return;
  }

  try {
    await t.sendMail({ from: env.smtp.from, to, subject, html });
  } catch (err) {
    console.error("Failed to send email:", err.message);
  }
}

module.exports = { sendEmail };