import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import { TenantConnectionOptions } from '@app/database';

@Injectable()
export class TenantConnectionManager implements OnModuleDestroy {
  private readonly logger = new Logger(TenantConnectionManager.name);
  private tenantConnections: Map<string, Sequelize> = new Map();
  private pendingConnections: Map<string, Promise<Sequelize>> = new Map();

  async onModuleDestroy() {
    await this.closeAllConnections();
  }

  /**
   * Create or retrieve dynamic connection pool for a tenant safely
   */
  async getConnection(options: TenantConnectionOptions): Promise<Sequelize> {
    const key = options.tenantId;

    if (this.tenantConnections.has(key)) {
      return this.tenantConnections.get(key)!;
    }

    // Prevent race conditions / duplicate connections
    if (this.pendingConnections.has(key)) {
      return this.pendingConnections.get(key)!;
    }

    const connectionPromise = (async () => {
      try {
        const connection = new Sequelize({
          host: options.host,
          port: options.port,
          username: options.username,
          password: options.password,
          database: options.databaseName,
          dialect: options.dialect || 'postgres',
          logging: process.env.NODE_ENV === 'development' ? (msg) => this.logger.debug(msg) : false,
          pool: {
            max: 5,
            min: 1,
            idle: 10000,
            acquire: 30000,
          },
        });

        await connection.authenticate();
        this.tenantConnections.set(key, connection);
        this.logger.log(`Initialized database connection pool for tenant: ${key} (${options.databaseName})`);
        return connection;
      } finally {
        this.pendingConnections.delete(key);
      }
    })();

    this.pendingConnections.set(key, connectionPromise);
    return connectionPromise;
  }

  /**
   * Close connection for a tenant
   */
  async closeConnection(tenantId: string): Promise<void> {
    const connection = this.tenantConnections.get(tenantId);
    if (connection) {
      await connection.close();
      this.tenantConnections.delete(tenantId);
      this.logger.log(`Closed database connection for tenant: ${tenantId}`);
    }
  }

  /**
   * Close all active tenant connections gracefully
   */
  async closeAllConnections(): Promise<void> {
    for (const [tenantId, connection] of this.tenantConnections.entries()) {
      try {
        await connection.close();
      } catch (err: any) {
        this.logger.error(`Error closing connection for tenant ${tenantId}: ${err.message}`);
      }
    }
    this.tenantConnections.clear();
    this.pendingConnections.clear();
  }

  /**
   * Get active tenant connection map
   */
  getActiveConnections(): Map<string, Sequelize> {
    return this.tenantConnections;
  }
}
