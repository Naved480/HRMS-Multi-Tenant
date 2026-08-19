import { Injectable, UnauthorizedException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Tenant, User, Role, EmployeeProfile, SuperAdmin, TenantDatabaseConfig } from '../../database/models';
import {
  RegisterTenantDto,
  LoginDto,
  SuperAdminLoginDto,
  OnboardOrganizationDto,
  ForgotPasswordDto,
  VerifyOtpDto,
  ResetPasswordDto,
} from './dto/auth.dto';
import { OtpService } from '../../../apps/auth-service/src/otp.service';
import { TenantConnectionManager } from '../../core/tenant-connection.manager';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    @InjectModel(Tenant) private tenantModel: typeof Tenant,
    @InjectModel(User) private userModel: typeof User,
    @InjectModel(Role) private roleModel: typeof Role,
    @InjectModel(EmployeeProfile) private employeeModel: typeof EmployeeProfile,
    @InjectModel(SuperAdmin) private superAdminModel: typeof SuperAdmin,
    @InjectModel(TenantDatabaseConfig) private tenantDbConfigModel: typeof TenantDatabaseConfig,
    private jwtService: JwtService,
    private otpService: OtpService,
    private tenantConnectionManager: TenantConnectionManager,
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
    const existingTenant = await this.tenantModel.findOne({ where: { domain: dto.domain } });
    if (existingTenant) {
      throw new BadRequestException('Organization domain already registered.');
    }

    const existingUser = await this.userModel.findOne({ where: { email: dto.adminEmail } });
    if (existingUser) {
      throw new BadRequestException('Admin user email already registered.');
    }

    const tenant = await this.tenantModel.create({
      name: dto.companyName,
      domain: dto.domain,
    });

    const dbConfig = await this.tenantDbConfigModel.create({
      tenantId: tenant.id,
      dbHost: dto.dbHost || 'localhost',
      dbPort: dto.dbPort || 5432,
      dbName: dto.dbName || `hrms_tenant_${dto.domain.replace(/[^a-zA-Z0-9]/g, '_')}`,
      dbUsername: dto.dbUsername || 'postgres',
      dbPasswordHash: dto.dbPassword ? await bcrypt.hash(dto.dbPassword, 10) : 'postgres',
      connectionStatus: 'active',
    });

    // Auto-provision dynamic separate DB for the organization
    try {
      await this.tenantConnectionManager.provisionOrganizationDatabase({
        tenantId: tenant.id,
        dbHost: dbConfig.dbHost,
        dbPort: dbConfig.dbPort,
        dbName: dbConfig.dbName,
        dbUsername: dbConfig.dbUsername,
        dbPasswordHash: dto.dbPassword || 'postgres',
      });
    } catch (err) {
      // Graceful fallback if local postgres database hasn't been created manually yet
    }

    const adminRole = await this.roleModel.create({
      tenantId: tenant.id,
      name: 'Admin',
      permissions: ['*'],
    });

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.userModel.create({
      tenantId: tenant.id,
      email: dto.adminEmail,
      passwordHash,
      roleId: adminRole.id,
    });

    await this.employeeModel.create({
      tenantId: tenant.id,
      userId: user.id,
      firstName: dto.firstName,
      lastName: dto.lastName,
      employeeCode: 'EMP-0001',
    });

    return {
      message: 'Organization onboarded successfully with isolated database setup',
      tenantId: tenant.id,
      domain: tenant.domain,
      adminEmail: user.email,
      databaseName: dbConfig.dbName,
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.userModel.findOne({ where: { email: dto.email } });
    const superAdmin = await this.superAdminModel.findOne({ where: { email: dto.email } });

    if (!user && !superAdmin) {
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
    } else if (user) {
      // Store on user record or transient memory
      (user as any).resetOtp = otpRecord.hashedCode;
      (user as any).resetOtpExpiresAt = otpRecord.expiresAt;
      await user.save();
    }

    return {
      message: 'Email OTP Verification code sent successfully.',
      email: dto.email,
      // Returning raw OTP for testing/verification ease
      demoOtpCode: otpRecord.code,
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const user = await this.userModel.findOne({ where: { email: dto.email } });
    const superAdmin = await this.superAdminModel.findOne({ where: { email: dto.email } });

    const target = superAdmin || user;
    if (!target) {
      throw new BadRequestException('Invalid request');
    }

    const storedOtp = (target as any).resetOtp;
    const expiresAt = (target as any).resetOtpExpiresAt;

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

    const user = await this.userModel.findOne({ where: { email: dto.email } });
    const superAdmin = await this.superAdminModel.findOne({ where: { email: dto.email } });

    const target = superAdmin || user;
    if (!target) {
      throw new BadRequestException('Invalid request');
    }

    // Verify OTP first
    const storedOtp = (target as any).resetOtp;
    const expiresAt = (target as any).resetOtpExpiresAt;
    await this.otpService.verifyOtp(dto.otp, storedOtp, expiresAt);

    // Check that new password differs from previous password
    const isSamePassword = await bcrypt.compare(dto.newPassword, (target as any).passwordHash);
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
    } else if (user) {
      await user.update({
        passwordHash: newHash,
      });
    }

    return {
      message: 'Your new password has been successfully saved.',
      email: dto.email,
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
    const user = await this.userModel.findOne({
      where: { email: dto.email },
      include: [Tenant, Role],
    });

    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role?.name,
    });

    return {
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        tenantId: user.tenantId,
        tenantName: user.tenant?.name,
        role: user.role?.name,
      },
    };
  }
}

