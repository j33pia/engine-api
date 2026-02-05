import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

const IV_LENGTH = 16;
// In production, this should be in .env as ENCRYPTION_KEY (32 chars)
// For dev, we'll use a hardcoded fallback or generate one (Note: generating on fly means data loss on restart if not persisted)
// Let's assume a fixed key for this environment to survive restarts without .env complexity right now.
const ENCRYPTION_KEY = 'vOvH6sdHfT7&|g^d<>{W^32<62@;>|7&'; // 32 chars exactly

export class CryptoUtil {
    static async encrypt(text: string): Promise<string> {
        const iv = randomBytes(IV_LENGTH);
        const cipher = createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
        let encrypted = cipher.update(text);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return iv.toString('hex') + ':' + encrypted.toString('hex');
    }

    static async decrypt(text: string): Promise<string> {
        const textParts = text.split(':');
        const ivHex = textParts.shift();
        if (!ivHex) throw new Error('Invalid encrypted text format');
        const iv = Buffer.from(ivHex, 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const decipher = createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    }
}
