import { Injectable, BadRequestException } from '@nestjs/common';
import { Sequelize } from 'sequelize';
import { TenantService } from './tenant.service';
import { TenantDatabaseConfigService } from './tenant-database-config.service';
import { TenantConnectionManager } from '@app/tenant-context';

@Injectable()
export class TenantProvisioningService {
  constructor(
    private tenantService: TenantService,
    private tenantDbConfigService: TenantDatabaseConfigService,
    private tenantConnectionManager: TenantConnectionManager,
  ) {}

  /**
   * Provision a new tenant with dedicated database and schema setup
   */
  async provisionNewTenant(
    tenantName: string,
    organizationName: string,
    email: string,
    planType: string,
  ): Promise<{
    tenantId: string;
    databaseName: string;
    message: string;
  }> {
    // Step 1: Create tenant record in platform DB
    const tenant = await this.tenantService.createTenant({
      name: tenantName,
      organizationName,
      email,
      planType,
      isActive: true,
    });

    const databaseName = `hrms_${tenant.id.replace(/-/g, '_')}`;

    try {
      // Step 2: Create database for this tenant
      await this.createTenantDatabase(databaseName);

      // Step 3: Run migrations / model synchronization for tenant DB
      await this.runMigrationsForTenant(databaseName);

      // Step 4: Store database configuration in platform DB
      await this.tenantDbConfigService.createTenantDatabaseConfig(
        tenant.id,
        databaseName,
        process.env.TENANT_DB_HOST || 'localhost',
        parseInt(process.env.TENANT_DB_PORT || '5432'),
        process.env.TENANT_DB_USER || 'postgres',
        process.env.TENANT_DB_PASSWORD || 'password',
      );

      return {
        tenantId: tenant.id,
        databaseName,
        message: `Tenant provisioned successfully. Database ${databaseName} created and initialized.`,
      };
    } catch (error: any) {
      // Rollback: Drop DB if created, and delete tenant record
      try {
        await this.dropTenantDatabase(databaseName);
      } catch {
        // Ignore DB drop error during rollback if it wasn't created
      }

      await this.tenantService.deleteTenant(tenant.id);
      throw new BadRequestException(
        `Failed to provision tenant: ${error.message}`,
      );
    }
  }

  /**
   * Create a new database for tenant
   */
  private async createTenantDatabase(databaseName: string): Promise<void> {
    const sequelize = new Sequelize({
      host: process.env.TENANT_DB_HOST || 'localhost',
      port: parseInt(process.env.TENANT_DB_PORT || '5432'),
      username: process.env.TENANT_DB_USER || 'postgres',
      password: process.env.TENANT_DB_PASSWORD || 'password',
      dialect: 'postgres',
      logging: false,
    });

    try {
      await sequelize.query(`CREATE DATABASE "${databaseName}";`);
      console.log(`Database ${databaseName} created successfully`);
    } catch (error: any) {
      if (error.message && error.message.includes('already exists')) {
        throw new BadRequestException(`Database ${databaseName} already exists`);
      }
      throw error;
    } finally {
      await sequelize.close();
    }
  }

  /**
   * Run migrations / table synchronization for a newly created tenant database
   */
  private async runMigrationsForTenant(databaseName: string): Promise<void> {
    const sequelize = new Sequelize({
      host: process.env.TENANT_DB_HOST || 'localhost',
      port: parseInt(process.env.TENANT_DB_PORT || '5432'),
      username: process.env.TENANT_DB_USER || 'postgres',
      password: process.env.TENANT_DB_PASSWORD || 'password',
      database: databaseName,
      dialect: 'postgres',
      logging: false,
    });

    try {
      await sequelize.authenticate();
      // Synchronize initial schemas/tables for tenant database
      await sequelize.sync({ force: false });
      console.log(`Migrations/sync executed successfully for ${databaseName}`);
    } catch (error: any) {
      console.error(`Migration failed for ${databaseName}:`, error.message);
      throw error;
    } finally {
      await sequelize.close();
    }
  }

  /**
   * Deprovision a tenant (close active connections, drop database, remove configs & record)
   */
  async deprovisionTenant(tenantId: string): Promise<void> {
    const dbConfig = await this.tenantDbConfigService.getTenantDatabaseConfig(
      tenantId,
    );

    try {
      // Step 1: Close cached connections in manager
      await this.tenantConnectionManager.closeConnection(tenantId);

      // Step 2: Drop database
      await this.dropTenantDatabase(dbConfig.databaseName);

      // Step 3: Delete configuration
      await this.tenantDbConfigService.deleteTenantDatabaseConfig(tenantId);

      // Step 4: Delete tenant record
      await this.tenantService.deleteTenant(tenantId);

      console.log(`Tenant ${tenantId} deprovisioned successfully`);
    } catch (error: any) {
      throw new BadRequestException(
        `Failed to deprovision tenant: ${error.message}`,
      );
    }
  }

  /**
   * Drop a tenant's database
   */
  private async dropTenantDatabase(databaseName: string): Promise<void> {
    const sequelize = new Sequelize({
      host: process.env.TENANT_DB_HOST || 'localhost',
      port: parseInt(process.env.TENANT_DB_PORT || '5432'),
      username: process.env.TENANT_DB_USER || 'postgres',
      password: process.env.TENANT_DB_PASSWORD || 'password',
      dialect: 'postgres',
      logging: false,
    });

    try {
      // Terminate all connections to the database
      await sequelize.query(`
        SELECT pg_terminate_backend(pg_stat_activity.pid)
        FROM pg_stat_activity
        WHERE pg_stat_activity.datname = '${databaseName}'
        AND pid <> pg_backend_pid();
      `);

      // Drop database
      await sequelize.query(`DROP DATABASE IF EXISTS "${databaseName}";`);
      console.log(`Database ${databaseName} dropped successfully`);
    } catch (error) {
      throw error;
    } finally {
      await sequelize.close();
    }
  }
}
