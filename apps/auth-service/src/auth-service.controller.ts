import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MESSAGE_PATTERNS } from '@app/common';
import { AuthService } from '../../../src/modules/auth/auth.service';
import { RegisterTenantDto, LoginDto } from '../../../src/modules/auth/dto/auth.dto';

@Controller()
export class AuthMicroserviceController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern(MESSAGE_PATTERNS.AUTH.REGISTER_TENANT)
  registerTenant(@Payload() dto: RegisterTenantDto) {
    return this.authService.registerTenant(dto);
  }

  @MessagePattern(MESSAGE_PATTERNS.AUTH.LOGIN)
  login(@Payload() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
