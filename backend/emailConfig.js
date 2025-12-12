const nodemailer = require('nodemailer');

// Create a dummy transporter to prevent email errors
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'dummy@example.com',
    pass: 'dummy-password'
  }
});

// Disable email functionality to prevent startup errors
console.log('Email functionality disabled for development');

module.exports = { transporter };
