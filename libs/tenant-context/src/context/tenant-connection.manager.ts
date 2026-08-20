import { Injectable } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import { TenantConnectionOptions } from '@app/database';

@Injectable()
export class TenantConnectionManager {
  private tenantConnections: Map<string, Sequelize> = new Map();

  /**
   * Create or retrieve connection for a tenant
   */
  async getConnection(options: TenantConnectionOptions): Promise<Sequelize> {
    const key = options.tenantId;

    if (this.tenantConnections.has(key)) {
      return this.tenantConnections.get(key)!;
    }

    const connection = new Sequelize({
      host: options.host,
      port: options.port,
      username: options.username,
      password: options.password,
      database: options.databaseName,
      dialect: options.dialect,
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: 5,
        min: 1,
        idle: 10000,
      },
    });

    await connection.authenticate();
    this.tenantConnections.set(key, connection);

    return connection;
  }

  /**
   * Close connection for a tenant
   */
  async closeConnection(tenantId: string): Promise<void> {
    const connection = this.tenantConnections.get(tenantId);
    if (connection) {
      await connection.close();
      this.tenantConnections.delete(tenantId);
    }
  }

  /**
   * Close all tenant connections
   */
  async closeAllConnections(): Promise<void> {
    for (const [tenantId, connection] of this.tenantConnections.entries()) {
      await connection.close();
      this.tenantConnections.delete(tenantId);
    }
  }

  /**
   * Get all active tenant connections
   */
  getActiveConnections(): Map<string, Sequelize> {
    return this.tenantConnections;
  }
}
