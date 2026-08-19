import { Controller, Post, Body, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ClientProxy } from '@nestjs/microservices';
import { SERVICES, MESSAGE_PATTERNS, SuperAdminLoginDto, OnboardOrganizationDto } from '@app/common';

@ApiTags('SuperAdmin Platform Management')
@Controller('superadmin')
export class SuperAdminController {
  constructor(
    @Inject(SERVICES.AUTH_SERVICE) private readonly authClient: ClientProxy,
  ) {}

  @Post('login')
  @ApiOperation({ summary: 'SuperAdmin System Login' })
  superAdminLogin(@Body() dto: SuperAdminLoginDto) {
    return this.authClient.send(MESSAGE_PATTERNS.AUTH.SUPERADMIN_LOGIN, dto);
  }

  @Post('organizations/onboard')
  @ApiOperation({ summary: 'Onboard a new organization tenant with isolated database setup' })
  onboardOrganization(@Body() dto: OnboardOrganizationDto) {
    return this.authClient.send(MESSAGE_PATTERNS.AUTH.ONBOARD_ORGANIZATION, dto);
  }
}
