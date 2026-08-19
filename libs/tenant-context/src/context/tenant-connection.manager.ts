import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';

export interface OrgDbConnectionConfig {
  tenantId: string;
  dbHost: string;
  dbPort: number;
  dbName: string;
  dbUsername: string;
  dbPasswordHash: string;
}

@Injectable()
export class TenantConnectionManager implements OnModuleDestroy {
  private readonly logger = new Logger(TenantConnectionManager.name);
  private readonly connections = new Map<string, Sequelize>();

  /**
   * Get existing or establish new Sequelize DB connection for a specific organization (tenant).
   */
  async getTenantConnection(config: OrgDbConnectionConfig, models?: any[]): Promise<Sequelize> {
    if (this.connections.has(config.tenantId)) {
      return this.connections.get(config.tenantId)!;
    }

    this.logger.log(`Establishing dedicated database connection for Tenant: ${config.tenantId} (${config.dbName})`);

    const sequelize = new Sequelize({
      dialect: 'postgres',
      host: config.dbHost,
      port: config.dbPort,
      username: config.dbUsername,
      password: config.dbPasswordHash,
      database: config.dbName,
      models: models || [],
      logging: false,
    });

    await sequelize.authenticate();
    this.connections.set(config.tenantId, sequelize);
    return sequelize;
  }

  /**
   * Auto-provisions and syncs a separate dedicated database when a SuperAdmin onboards an organization.
   */
  async provisionOrganizationDatabase(config: OrgDbConnectionConfig, models?: any[]): Promise<void> {
    this.logger.log(`Provisioning database '${config.dbName}' for Organization Tenant ID ${config.tenantId}`);

    const connection = await this.getTenantConnection(config, models);
    if (models && models.length > 0) {
      await connection.sync({ alter: true });
    }
    this.logger.log(`Database schema successfully provisioned for Organization: ${config.tenantId}`);
  }

  async onModuleDestroy() {
    for (const [tenantId, sequelize] of this.connections.entries()) {
      this.logger.log(`Closing connection for Tenant ID ${tenantId}`);
      await sequelize.close();
    }
    this.connections.clear();
  }
}
