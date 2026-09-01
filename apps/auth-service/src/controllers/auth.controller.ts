import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  MESSAGE_PATTERNS,
  RegisterTenantDto,
  LoginDto,
  SuperAdminLoginDto,
  OnboardOrganizationDto,
  ForgotPasswordDto,
  VerifyOtpDto,
  ResetPasswordDto,
} from '@app/common';
import { AuthService } from '../services/auth.service';

@Controller()
export class AuthMicroserviceController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern(MESSAGE_PATTERNS.HEALTH.CHECK)
  healthCheck() {
    return { service: 'auth-service', status: 'up', timestamp: new Date().toISOString() };
  }

  @MessagePattern(MESSAGE_PATTERNS.AUTH.CREATE_ADMIN_CREDENTIAL)
  createAdminCredential(
    @Payload() data: { email: string; password: string; tenantId: string; tenantName?: string; role?: string },
  ) {
    return this.authService.createAdminCredential(data);
  }

  @MessagePattern(MESSAGE_PATTERNS.AUTH.SUPERADMIN_LOGIN)
  superAdminLogin(@Payload() dto: SuperAdminLoginDto) {
    return this.authService.superAdminLogin(dto);
  }

  @MessagePattern(MESSAGE_PATTERNS.AUTH.ONBOARD_ORGANIZATION)
  onboardOrganization(@Payload() dto: OnboardOrganizationDto) {
    return this.authService.onboardOrganization(dto);
  }

  @MessagePattern(MESSAGE_PATTERNS.AUTH.FORGOT_PASSWORD)
  forgotPassword(@Payload() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @MessagePattern(MESSAGE_PATTERNS.AUTH.VERIFY_OTP)
  verifyOtp(@Payload() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @MessagePattern(MESSAGE_PATTERNS.AUTH.RESET_PASSWORD)
  resetPassword(@Payload() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @MessagePattern(MESSAGE_PATTERNS.AUTH.REGISTER_TENANT)
  registerTenant(@Payload() dto: RegisterTenantDto) {
    return this.authService.registerTenant(dto);
  }

  @MessagePattern(MESSAGE_PATTERNS.AUTH.LOGIN)
  login(@Payload() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
