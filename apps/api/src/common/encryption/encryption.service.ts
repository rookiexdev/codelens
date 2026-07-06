import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Buffer } from 'node:buffer';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-cbc';
const IV_BYTES = 16;
const KEY_BYTES = 32;

@Injectable()
export class EncryptionService {
  private readonly key: Buffer;

  constructor(config: ConfigService) {
    const raw = config.get<string>('ENCRYPTION_KEY');
    if (!raw) {
      throw new Error('ENCRYPTION_KEY is not set');
    }
    const keyBuf = Buffer.from(raw, 'utf8');
    if (keyBuf.length !== KEY_BYTES) {
      throw new Error(
        `ENCRYPTION_KEY must be exactly ${KEY_BYTES} bytes (ASCII chars)`,
      );
    }
    this.key = keyBuf;
  }

  encrypt(text: string): string {
    const iv = randomBytes(IV_BYTES);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);
    const encrypted = Buffer.concat([
      cipher.update(text, 'utf8'),
      cipher.final(),
    ]);
    return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
  }

  decrypt(text: string): string {
    const sepIdx = text.indexOf(':');
    if (sepIdx <= 0 || sepIdx === text.length - 1) {
      throw new Error('Invalid encrypted payload format');
    }
    const ivHex = text.slice(0, sepIdx);
    const dataHex = text.slice(sepIdx + 1);
    const iv = Buffer.from(ivHex, 'hex');
    if (iv.length !== IV_BYTES) {
      throw new Error('Invalid IV length in encrypted payload');
    }
    const data = Buffer.from(dataHex, 'hex');
    const decipher = createDecipheriv(ALGORITHM, this.key, iv);
    const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
    return decrypted.toString('utf8');
  }
}
