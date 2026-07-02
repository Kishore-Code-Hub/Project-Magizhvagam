const crypto = require('crypto');

/**
 * Custom lightweight base32 decoder.
 */
function base32Decode(base32) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const clean = base32.toUpperCase().replace(/=+$/, '').replace(/\s/g, '');
  let bits = 0;
  let value = 0;
  const bytes = [];
  
  for (let i = 0; i < clean.length; i++) {
    const idx = alphabet.indexOf(clean[i]);
    if (idx === -1) {
      throw new Error('Invalid base32 character');
    }
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

/**
 * Generates a cryptographically secure random base32 secret.
 */
function generateBase32Secret(length = 16) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const randomBytes = crypto.randomBytes(length);
  let secret = '';
  for (let i = 0; i < randomBytes.length; i++) {
    secret += alphabet[randomBytes[i] % 32];
  }
  return secret;
}

/**
 * Verifies a 6-digit TOTP token against a base32 secret key.
 */
function verifyTOTP(token, secret, window = 1) {
  if (!token || !secret) return false;
  try {
    const key = base32Decode(secret);
    const epoch = Math.floor(Date.now() / 1000);
    const timeStep = 30;
    const counter = Math.floor(epoch / timeStep);

    // Verify token within a window (adjacent steps)
    for (let i = -window; i <= window; i++) {
      const step = counter + i;
      const buffer = Buffer.alloc(8);
      // Write 64-bit integer counter value
      buffer.writeUInt32BE(Math.floor(step / 0x100000000), 0);
      buffer.writeUInt32BE(step & 0xffffffff, 4);

      const hmac = crypto.createHmac('sha1', key).update(buffer).digest();
      const offset = hmac[hmac.length - 1] & 0xf;
      const code = ((hmac[offset] & 0x7f) << 24) |
                   ((hmac[offset + 1] & 0xff) << 16) |
                   ((hmac[offset + 2] & 0xff) << 8) |
                   (hmac[offset + 3] & 0xff);

      const otp = (code % 1000000).toString().padStart(6, '0');
      if (otp === token) return true;
    }
    return false;
  } catch (err) {
    return false;
  }
}

/**
 * Generates a list of backup/recovery codes.
 */
function generateRecoveryCodes(count = 8) {
  const codes = [];
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    // Format as XXXX-XXXX for readability
    codes.push(code.substring(0, 4) + '-' + code.substring(4, 8));
  }
  return codes;
}

module.exports = {
  generateBase32Secret,
  verifyTOTP,
  generateRecoveryCodes
};
