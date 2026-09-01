import { Controller, Get, Post, Body, Query, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ClientProxy } from '@nestjs/microservices';
import {
  SERVICES,
  MESSAGE_PATTERNS,
  ActivateAdminDto,
  Public,
} from '@app/common';

@ApiTags('Organization Admin Activation')
@Controller('organization-admin')
@Public()
export class OrganizationAdminActivationController {
  constructor(
    @Inject(SERVICES.TENANT_SERVICE) private readonly tenantClient: ClientProxy,
  ) {}

  @Get('validate')
  @ApiOperation({ summary: 'Validate Organization Admin Invitation Token' })
  @ApiQuery({ name: 'token', description: 'Raw invitation token' })
  validateInvitationToken(@Query('token') token: string) {
    return this.tenantClient.send(MESSAGE_PATTERNS.INVITATION.VALIDATE, { token });
  }

  @Post('activate')
  @ApiOperation({ summary: 'Activate Organization Admin Account & Set Password' })
  activateAdminAccount(@Body() dto: ActivateAdminDto) {
    return this.tenantClient.send(MESSAGE_PATTERNS.INVITATION.ACTIVATE, dto);
  }
}
