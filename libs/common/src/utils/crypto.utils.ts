import * as crypto from 'crypto';

export class CryptoUtils {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly SECRET_KEY = crypto
    .createHash('sha256')
    .update(process.env.ENCRYPTION_KEY || 'hrms-platform-secret-key-32bytes!')
    .digest();

  /**
   * Encrypt a sensitive text (e.g. tenant DB password)
   */
  static encrypt(text: string): string {
    if (!text) return text;
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(this.ALGORITHM, this.SECRET_KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  /**
   * Decrypt an encrypted text
   */
  static decrypt(cipherText: string): string {
    if (!cipherText || !cipherText.includes(':')) return cipherText;
    try {
      const [ivHex, authTagHex, encryptedText] = cipherText.split(':');
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      const decipher = crypto.createDecipheriv(this.ALGORITHM, this.SECRET_KEY, iv);
      decipher.setAuthTag(authTag);
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch {
      // Fallback for unencrypted legacy string
      return cipherText;
    }
  }
}
