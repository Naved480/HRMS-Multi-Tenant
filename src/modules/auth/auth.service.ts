import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Tenant, User, Role, EmployeeProfile } from '../../database/models';
import { RegisterTenantDto, LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Tenant) private tenantModel: typeof Tenant,
    @InjectModel(User) private userModel: typeof User,
    @InjectModel(Role) private roleModel: typeof Role,
    @InjectModel(EmployeeProfile) private employeeModel: typeof EmployeeProfile,
    private jwtService: JwtService,
  ) {}

  async registerTenant(dto: RegisterTenantDto) {
    const existingTenant = await this.tenantModel.findOne({ where: { domain: dto.domain } });
    if (existingTenant) {
      throw new BadRequestException('Domain already registered.');
    }

    const existingUser = await this.userModel.findOne({ where: { email: dto.adminEmail } });
    if (existingUser) {
      throw new BadRequestException('User email already registered.');
    }

    const tenant = await this.tenantModel.create({
      name: dto.companyName,
      domain: dto.domain,
    });

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

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      tenantId: tenant.id,
      role: adminRole.name,
    });

    return {
      message: 'Tenant and Admin registered successfully',
      tenantId: tenant.id,
      accessToken: token,
    };
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
