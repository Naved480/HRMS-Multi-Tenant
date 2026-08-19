import { Controller, Post, Body, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ClientProxy } from '@nestjs/microservices';
import { SERVICES, MESSAGE_PATTERNS } from '@app/common';
import { RegisterTenantDto, LoginDto } from '../../../src/modules/auth/dto/auth.dto';

@ApiTags('Auth Gateway')
@Controller('auth')
export class ApiGatewayAuthController {
  constructor(
    @Inject(SERVICES.AUTH_SERVICE) private readonly authClient: ClientProxy,
  ) {}

  @Post('register-tenant')
  @ApiOperation({ summary: 'Onboard organization via Auth Microservice' })
  registerTenant(@Body() dto: RegisterTenantDto) {
    return this.authClient.send(MESSAGE_PATTERNS.AUTH.REGISTER_TENANT, dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Authenticate user via Auth Microservice' })
  login(@Body() dto: LoginDto) {
    return this.authClient.send(MESSAGE_PATTERNS.AUTH.LOGIN, dto);
  }
}
