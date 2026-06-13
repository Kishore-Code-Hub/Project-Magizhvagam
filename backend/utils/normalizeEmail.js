function normalizeEmail(email) {
  if (!email || typeof email !== 'string') return email;
  email = email.trim().toLowerCase();
  const parts = email.split('@');
  if (parts.length !== 2) return email;
  const local = parts[0];
  const domain = parts[1];
  if (domain === 'gmail.com') {
    const cleanLocal = local.split('+')[0];
    return `${cleanLocal}@gmail.com`;
  }
  return email;
}

module.exports = normalizeEmail;
