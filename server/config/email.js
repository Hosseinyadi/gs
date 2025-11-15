const nodemailer = require('nodemailer');

// Email configuration
const emailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
};

// Create transporter
let transporter = null;

function getTransporter() {
  if (!transporter && emailConfig.auth.user && emailConfig.auth.pass) {
    transporter = nodemailer.createTransport(emailConfig);
    console.log('✅ Email transporter initialized');
  }
  return transporter;
}

// Check if email is configured
function isEmailConfigured() {
  return !!(emailConfig.auth.user && emailConfig.auth.pass);
}

module.exports = {
  getTransporter,
  isEmailConfigured,
  emailConfig
};
