import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { TenantServiceModule } from './tenant-service.module';

async function bootstrap() {
  const port = parseInt(process.env.TENANT_SERVICE_PORT || '3002', 10);
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(TenantServiceModule, {
    transport: Transport.TCP,
    options: {
      host: '0.0.0.0',
      port,
    },
  });

  await app.listen();
  console.log(`Tenant Microservice is listening on TCP port ${port}`);
}
bootstrap();
