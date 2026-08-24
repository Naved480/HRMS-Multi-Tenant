import { Injectable, UnauthorizedException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { SuperAdmin, AuthCredential } from '../models';
import {
  RegisterTenantDto,
  LoginDto,
  SuperAdminLoginDto,
  OnboardOrganizationDto,
  ForgotPasswordDto,
  VerifyOtpDto,
  ResetPasswordDto,
} from '@app/common';
import { OtpService } from './otp.service';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    @InjectModel(SuperAdmin) private superAdminModel: typeof SuperAdmin,
    @InjectModel(AuthCredential) private credentialModel: typeof AuthCredential,
    private jwtService: JwtService,
    private otpService: OtpService,
  ) {}

  async onModuleInit() {
    // Seed default SuperAdmin if none exists
    const count = await this.superAdminModel.count();
    if (count === 0) {
      const passwordHash = await bcrypt.hash('SuperAdmin123!', 10);
      await this.superAdminModel.create({
        email: 'superadmin@system.com',
        name: 'System Super Admin',
        passwordHash,
        status: 'active',
        passwordHistory: [passwordHash],
      });
    }
  }

  /**
   * Create or update AuthCredential for Organization Admin activation
   */
  async createAdminCredential(data: {
    email: string;
    password: string;
    tenantId: string;
    tenantName?: string;
    role?: string;
  }) {
    const passwordHash = await bcrypt.hash(data.password, 10);
    const existing = await this.credentialModel.findOne({ where: { email: data.email } });

    if (existing) {
      await existing.update({
        passwordHash,
        tenantId: data.tenantId,
        tenantName: data.tenantName || existing.tenantName,
        role: data.role || 'Admin',
        isActive: true,
      });
      return { message: 'Admin credential updated successfully', credentialId: existing.id };
    }

    const credential = await this.credentialModel.create({
      email: data.email,
      passwordHash,
      tenantId: data.tenantId,
      tenantName: data.tenantName || 'Organization',
      role: data.role || 'Admin',
      isActive: true,
    });

    return { message: 'Admin credential created successfully', credentialId: credential.id };
  }

  async superAdminLogin(dto: SuperAdminLoginDto) {
    const admin = await this.superAdminModel.findOne({ where: { email: dto.email } });
    if (!admin || !(await bcrypt.compare(dto.password, admin.passwordHash))) {
      throw new UnauthorizedException('Invalid SuperAdmin credentials.');
    }

    const token = this.jwtService.sign({
      sub: admin.id,
      email: admin.email,
      isSuperAdmin: true,
      role: 'SuperAdmin',
    });

    return {
      message: 'SuperAdmin login successful',
      accessToken: token,
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: 'SuperAdmin',
      },
    };
  }

  async onboardOrganization(dto: OnboardOrganizationDto) {
    const existingCred = await this.credentialModel.findOne({ where: { email: dto.adminEmail } });
    if (existingCred) {
      throw new BadRequestException('Admin user email already registered.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const tenantId = `tenant-${dto.domain.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

    const credential = await this.credentialModel.create({
      email: dto.adminEmail,
      passwordHash,
      tenantId,
      tenantName: dto.companyName,
      role: 'Admin',
    });

    const token = this.jwtService.sign({
      sub: credential.id,
      email: credential.email,
      tenantId: credential.tenantId,
      role: credential.role,
    });

    return {
      message: 'Organization credentials created successfully',
      tenantId: credential.tenantId,
      domain: dto.domain,
      adminEmail: credential.email,
      accessToken: token,
    };
  }

  async registerTenant(dto: RegisterTenantDto) {
    return this.onboardOrganization({
      companyName: dto.companyName,
      domain: dto.domain,
      adminEmail: dto.adminEmail,
      password: dto.password,
      firstName: dto.firstName,
      lastName: dto.lastName,
    });
  }

  async login(dto: LoginDto) {
    const credential = await this.credentialModel.findOne({
      where: { email: dto.email },
    });

    if (!credential || !(await bcrypt.compare(dto.password, credential.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (!credential.isActive) {
      throw new UnauthorizedException('Account is inactive. Please contact your organization administrator.');
    }

    const token = this.jwtService.sign({
      sub: credential.id,
      email: credential.email,
      tenantId: credential.tenantId,
      role: credential.role,
    });

    return {
      accessToken: token,
      user: {
        id: credential.id,
        email: credential.email,
        tenantId: credential.tenantId,
        tenantName: credential.tenantName,
        role: credential.role,
      },
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const credential = await this.credentialModel.findOne({ where: { email: dto.email } });
    const superAdmin = await this.superAdminModel.findOne({ where: { email: dto.email } });

    if (!credential && !superAdmin) {
      // Do not reveal email existence for security
      return {
        message: "If you forgot your password, well, then we'll email you instructions to reset your password.",
      };
    }

    const otpRecord = await this.otpService.generateOtp();

    if (superAdmin) {
      await superAdmin.update({
        resetOtp: otpRecord.hashedCode,
        resetOtpExpiresAt: otpRecord.expiresAt,
      });
    } else if (credential) {
      credential.resetOtp = otpRecord.hashedCode;
      credential.resetOtpExpiresAt = otpRecord.expiresAt;
      await credential.save();
    }

    return {
      message: 'Email OTP Verification code sent successfully.',
      email: dto.email,
      demoOtpCode: otpRecord.code,
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const credential = await this.credentialModel.findOne({ where: { email: dto.email } });
    const superAdmin = await this.superAdminModel.findOne({ where: { email: dto.email } });

    const target = superAdmin || credential;
    if (!target) {
      throw new BadRequestException('Invalid request');
    }

    const storedOtp = target.resetOtp;
    const expiresAt = target.resetOtpExpiresAt;

    await this.otpService.verifyOtp(dto.otp, storedOtp, expiresAt);

    return {
      message: 'OTP verified successfully. Please enter your new password.',
      email: dto.email,
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('New password and confirm password do not match.');
    }

    const credential = await this.credentialModel.findOne({ where: { email: dto.email } });
    const superAdmin = await this.superAdminModel.findOne({ where: { email: dto.email } });

    const target = superAdmin || credential;
    if (!target) {
      throw new BadRequestException('Invalid request');
    }

    // Verify OTP first
    const storedOtp = target.resetOtp;
    const expiresAt = target.resetOtpExpiresAt;
    await this.otpService.verifyOtp(dto.otp, storedOtp, expiresAt);

    // Check that new password differs from previous password
    const isSamePassword = await bcrypt.compare(dto.newPassword, target.passwordHash);
    if (isSamePassword) {
      throw new BadRequestException('Your new password must be different from previous used passwords.');
    }

    const newHash = await bcrypt.hash(dto.newPassword, 10);
    const history = (target as any).passwordHistory || [];
    history.push(newHash);

    if (superAdmin) {
      await superAdmin.update({
        passwordHash: newHash,
        resetOtp: null,
        resetOtpExpiresAt: null,
        passwordHistory: history,
      });
    } else if (credential) {
      await credential.update({
        passwordHash: newHash,
        resetOtp: null,
        resetOtpExpiresAt: null,
        passwordHistory: history,
      });
    }

    return {
      message: 'Your new password has been successfully saved.',
      email: dto.email,
    };
  }
}
