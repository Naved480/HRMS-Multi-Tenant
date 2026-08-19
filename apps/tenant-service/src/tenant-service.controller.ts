import { Controller } from '@nestjs/common';
import { TenantServiceService } from './tenant-service.service';

@Controller()
export class TenantServiceController {
  constructor(private readonly tenantServiceService: TenantServiceService) {}
  // Message patterns will be added here when tenant business logic is implemented
}
