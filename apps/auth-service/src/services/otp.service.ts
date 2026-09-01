import { Injectable, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

export interface OtpRecord {
  code: string;
  hashedCode: string;
  expiresAt: Date;
}

@Injectable()
export class OtpService {
  /**
   * Generates a 6-digit OTP code and expiry timestamp (10 minutes).
   */
  async generateOtp(): Promise<OtpRecord> {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const salt = await bcrypt.genSalt(10);
    const hashedCode = await bcrypt.hash(code, salt);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    return {
      code,
      hashedCode,
      expiresAt,
    };
  }

  /**
   * Validates provided OTP against stored hash and checks expiry.
   */
  async verifyOtp(providedOtp: string, storedHashedOtp: string, expiresAt: Date): Promise<boolean> {
    if (!storedHashedOtp || !expiresAt) {
      throw new BadRequestException('No active OTP request found');
    }

    if (new Date() > new Date(expiresAt)) {
      throw new BadRequestException('OTP code has expired. Please request a new one.');
    }

    const isValid = await bcrypt.compare(providedOtp, storedHashedOtp);
    if (!isValid) {
      throw new BadRequestException('Invalid OTP verification code.');
    }

    return true;
  }
}
