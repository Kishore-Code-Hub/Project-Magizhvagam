// Legacy utils wrapper — re-export new service implementation.
// This file kept for backwards compatibility; prefer importing from services/emailService.
const emailService = require('../services/emailService');

exports.sendVerificationEmail = async (to, token) => {
  return emailService.sendVerificationEmail(to, token);
};

exports.sendPasswordResetEmail = async (to, otp) => {
  return emailService.sendPasswordResetEmail(to, otp);
};
