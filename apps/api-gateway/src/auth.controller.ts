import { Controller, Post, Body, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ClientProxy } from '@nestjs/microservices';
import { SERVICES, MESSAGE_PATTERNS } from '@app/common';
import {
  RegisterTenantDto,
  LoginDto,
  ForgotPasswordDto,
  VerifyOtpDto,
  ResetPasswordDto,
} from '../../../src/modules/auth/dto/auth.dto';

@ApiTags('Auth Gateway')
@Controller('auth')
export class ApiGatewayAuthController {
  constructor(
    @Inject(SERVICES.AUTH_SERVICE) private readonly authClient: ClientProxy,
  ) {}

  @Post('login')
  @ApiOperation({ summary: 'Authenticate user via Auth Microservice' })
  login(@Body() dto: LoginDto) {
    return this.authClient.send(MESSAGE_PATTERNS.AUTH.LOGIN, dto);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset OTP code via email' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authClient.send(MESSAGE_PATTERNS.AUTH.FORGOT_PASSWORD, dto);
  }

  @Post('verify-otp')
  @ApiOperation({ summary: 'Verify email OTP code' })
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authClient.send(MESSAGE_PATTERNS.AUTH.VERIFY_OTP, dto);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password with verified OTP code' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authClient.send(MESSAGE_PATTERNS.AUTH.RESET_PASSWORD, dto);
  }
}

