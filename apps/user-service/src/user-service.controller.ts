import { Controller } from '@nestjs/common';
import { UserServiceService } from './user-service.service';

@Controller()
export class UserServiceController {
  constructor(private readonly userServiceService: UserServiceService) {}
  // Message patterns will be added here when user business logic is implemented
}
