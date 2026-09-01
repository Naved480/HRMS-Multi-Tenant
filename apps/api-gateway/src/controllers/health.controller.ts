import { Controller, Get, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ClientProxy } from '@nestjs/microservices';
import { Public, SERVICES, MESSAGE_PATTERNS } from '@app/common';
import { firstValueFrom, timeout } from 'rxjs';

@ApiTags('System Health')
@Controller('health')
export class ApiGatewayHealthController {
  constructor(
    @Inject(SERVICES.AUTH_SERVICE) private readonly authClient: ClientProxy,
    @Inject(SERVICES.TENANT_SERVICE) private readonly tenantClient: ClientProxy,
    @Inject(SERVICES.USER_SERVICE) private readonly userClient: ClientProxy,
  ) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Check API Gateway & Microservices System Health' })
  async checkHealth() {
    const checkService = async (client: ClientProxy, name: string) => {
      try {
        const res = await firstValueFrom(
          client.send(MESSAGE_PATTERNS.HEALTH.CHECK, {}).pipe(timeout(3000)),
        );
        return res || { service: name, status: 'up' };
      } catch (err: any) {
        return { service: name, status: 'down', error: err.message };
      }
    };

    const [authHealth, tenantHealth, userHealth] = await Promise.all([
      checkService(this.authClient, 'auth-service'),
      checkService(this.tenantClient, 'tenant-service'),
      checkService(this.userClient, 'user-service'),
    ]);

    return {
      service: 'api-gateway',
      status: 'up',
      timestamp: new Date().toISOString(),
      microservices: {
        auth: authHealth,
        tenant: tenantHealth,
        user: userHealth,
      },
    };
  }
}
