import crypto from 'crypto';

const fallbackKey = 'CyberSecurityAdminKey2026!32CharKey!';
const rawEncryptionKey = process.env.ENCRYPTION_KEY;
const ENCRYPTION_KEY = (rawEncryptionKey && rawEncryptionKey.length >= 32) ? rawEncryptionKey : fallbackKey;
const IV_LENGTH = 16;

export function encryptText(text: string): string {
  if (!text) return '';
  try {
    const sanitizedText = text.replace(/\s+/g, '');
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(sanitizedText, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
  } catch (err) {
    console.error('Encryption error:', err);
    return text;
  }
}

export function decryptText(encryptedText: string): string {
  if (!encryptedText) return '';
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) return encryptedText;

    const [ivHex, tagHex, contentHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const encrypted = Buffer.from(contentHex, 'hex');

    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8').replace(/\s+/g, '');
  } catch (err) {
    console.error('Decryption error:', err);
    return '';
  }
}
