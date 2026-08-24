import { Injectable, Logger } from '@nestjs/common';
import { Sequelize } from 'sequelize';
import { TenantService } from './tenant.service';
import { TenantDatabaseConfigService } from './tenant-database-config.service';
import { TenantConnectionManager } from '@app/tenant-context';
import { TenantProvisioningStatus, TenantStatus, TenantSetupStatus } from '../models/tenant.model';
import { TenantException, TenantErrorCode } from '@app/common';

export interface OrganizationCreationResult {
  tenantId: string;
  organizationName: string;
  slug: string;
  databaseName: string;
  status: TenantStatus;
  provisioningStatus: TenantProvisioningStatus;
  setupStatus: TenantSetupStatus;
  message: string;
}

@Injectable()
export class TenantProvisioningService {
  private readonly logger = new Logger(TenantProvisioningService.name);

  constructor(
    private tenantService: TenantService,
    private tenantDbConfigService: TenantDatabaseConfigService,
    private tenantConnectionManager: TenantConnectionManager,
  ) {}

  /**
   * Safe generator for PostgreSQL database names (Phase E)
   * Pattern: hrms_<sanitized_tenant_identifier>
   */
  public generateDatabaseName(tenantId: string): string {
    const safeIdentifier = tenantId.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
    return `hrms_${safeIdentifier}`;
  }

  /**
   * Safe generator for unique Organization Slugs (Phase D)
   */
  public generateSlug(organizationName: string, domain?: string): string {
    const base = domain || organizationName;
    return base
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Full Organization Creation & Tenant DB Provisioning (Phases C, D, E, F, G, H, I)
   */
  async createOrganizationAndProvision(data: {
    organizationName: string;
    adminEmail: string;
    adminName?: string;
    domain?: string;
    teamStrength?: string;
  }): Promise<OrganizationCreationResult> {
    const slug = this.generateSlug(data.organizationName, data.domain);

    // Check duplicate organization slug
    const existing = await this.tenantService.getTenantByDomainOrSlug(slug);
    if (existing) {
      throw new TenantException(
        TenantErrorCode.INVALID_TENANT_CONTEXT,
        `Organization with slug or domain '${slug}' already exists.`,
      );
    }

    // Step 1: Create Tenant Record in DRAFT status
    const tenant = await this.tenantService.createTenant({
      name: data.organizationName,
      organizationName: data.organizationName,
      slug,
      domain: slug,
      email: data.adminEmail,
      adminEmail: data.adminEmail,
      status: TenantStatus.DRAFT,
      setupStatus: TenantSetupStatus.NOT_STARTED,
      provisioningStatus: TenantProvisioningStatus.PENDING,
      isActive: true,
    });

    const databaseName = this.generateDatabaseName(tenant.id);

    // Step 2: Trigger Idempotent DB Provisioning Flow
    return this.provisionTenantDatabase(tenant.id, databaseName, data.organizationName, slug);
  }

  /**
   * Idempotent Database Provisioning Core (Phase F, G, H, I, J)
   */
  async provisionTenantDatabase(
    tenantId: string,
    customDbName?: string,
    organizationName?: string,
    slug?: string,
  ): Promise<OrganizationCreationResult> {
    const tenant = await this.tenantService.getTenantById(tenantId);
    const databaseName = customDbName || this.generateDatabaseName(tenant.id);

    // Update status to PROVISIONING
    await tenant.update({
      provisioningStatus: TenantProvisioningStatus.PROVISIONING,
      provisioningError: null,
    });

    try {
      // Step A: Check if database exists idempotently
      const dbExists = await this.checkDatabaseExists(databaseName);
      if (!dbExists) {
        await this.createTenantDatabase(databaseName);
      } else {
        this.logger.log(`Database '${databaseName}' already exists. Skipping SQL CREATE DATABASE.`);
      }

      // Step B: Initialize Base Schema & Migrations idempotently (Phase I)
      await this.runMigrationsAndBaseSchema(databaseName);

      // Step C: Save / Update TenantDatabaseConfig (Phase H)
      await this.tenantDbConfigService.saveOrUpdateTenantDatabaseConfig(
        tenant.id,
        databaseName,
        process.env.TENANT_DB_HOST || 'localhost',
        parseInt(process.env.TENANT_DB_PORT || '5432'),
        process.env.TENANT_DB_USER || 'postgres',
        process.env.TENANT_DB_PASSWORD || 'password',
      );

      // Step D: Mark Provisioning as READY & set status to PENDING_ADMIN_ACTIVATION
      await tenant.update({
        provisioningStatus: TenantProvisioningStatus.READY,
        status: TenantStatus.PENDING_ADMIN_ACTIVATION,
        setupStatus: TenantSetupStatus.NOT_STARTED,
      });

      this.logger.log(
        `Tenant ${tenant.id} (${databaseName}) database provisioned successfully. Status: PENDING_ADMIN_ACTIVATION.`,
      );

      return {
        tenantId: tenant.id,
        organizationName: tenant.organizationName || tenant.name,
        slug: tenant.slug || slug || tenant.domain,
        databaseName,
        status: TenantStatus.PENDING_ADMIN_ACTIVATION,
        provisioningStatus: TenantProvisioningStatus.READY,
        setupStatus: TenantSetupStatus.NOT_STARTED,
        message: `Organization database '${databaseName}' provisioned and initialized successfully. Pending Admin Activation.`,
      };
    } catch (error: any) {
      const safeErrorMessage = error.message || 'Unknown database provisioning error';
      this.logger.error(`Provisioning failed for tenant ${tenant.id}: ${safeErrorMessage}`);

      // Failure Handling (Phase J): Mark FAILED and store safe error metadata
      await tenant.update({
        provisioningStatus: TenantProvisioningStatus.FAILED,
        provisioningError: safeErrorMessage,
      });

      throw new TenantException(
        TenantErrorCode.INVALID_TENANT_CONTEXT,
        `Organization database provisioning failed: ${safeErrorMessage}`,
      );
    }
  }

  /**
   * Controlled Retry Provisioning Mechanism (Phase K)
   */
  async retryProvisioning(tenantId: string): Promise<OrganizationCreationResult> {
    const tenant = await this.tenantService.getTenantById(tenantId);

    if (tenant.provisioningStatus === TenantProvisioningStatus.READY) {
      return {
        tenantId: tenant.id,
        organizationName: tenant.organizationName || tenant.name,
        slug: tenant.slug || tenant.domain,
        databaseName: this.generateDatabaseName(tenant.id),
        status: tenant.status,
        provisioningStatus: TenantProvisioningStatus.READY,
        setupStatus: tenant.setupStatus,
        message: 'Tenant database is already provisioned and in READY status.',
      };
    }

    this.logger.log(`Retrying database provisioning for tenant ${tenantId}...`);
    return this.provisionTenantDatabase(tenant.id);
  }

  /**
   * Check if PostgreSQL database exists idempotently
   */
  private async checkDatabaseExists(databaseName: string): Promise<boolean> {
    const sequelize = this.getPlatformMasterSequelize();
    try {
      const [results]: any = await sequelize.query(
        `SELECT 1 FROM pg_database WHERE datname = '${databaseName}';`,
      );
      return results && results.length > 0;
    } catch {
      return false;
    } finally {
      await sequelize.close();
    }
  }

  /**
   * Create PostgreSQL database safely
   */
  private async createTenantDatabase(databaseName: string): Promise<void> {
    const sequelize = this.getPlatformMasterSequelize();
    try {
      await sequelize.query(`CREATE DATABASE "${databaseName}";`);
      this.logger.log(`Database "${databaseName}" created successfully.`);
    } catch (error: any) {
      if (error.message && error.message.includes('already exists')) {
        return;
      }
      throw error;
    } finally {
      await sequelize.close();
    }
  }

  /**
   * Run Base Tenant Schema Initialization & Migrations (Phase I)
   */
  private async runMigrationsAndBaseSchema(databaseName: string): Promise<void> {
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
      // Initialize base schema tracking table
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS tenant_schema_migrations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          version VARCHAR(50) NOT NULL UNIQUE,
          executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Record base migration version 1.0.0
      await sequelize.query(`
        INSERT INTO tenant_schema_migrations (version)
        VALUES ('1.0.0')
        ON CONFLICT (version) DO NOTHING;
      `);

      // Sync base tables idempotently
      await sequelize.sync({ force: false });
    } catch (error: any) {
      this.logger.error(`Base schema initialization failed for database ${databaseName}: ${error.message}`);
      throw error;
    } finally {
      await sequelize.close();
    }
  }

  /**
   * Deprovision tenant safely
   */
  async deprovisionTenant(tenantId: string): Promise<void> {
    const dbConfig = await this.tenantDbConfigService.getTenantDatabaseConfig(tenantId);
    try {
      await this.tenantConnectionManager.closeConnection(tenantId);
      await this.dropTenantDatabase(dbConfig.databaseName);
      await this.tenantDbConfigService.deleteTenantDatabaseConfig(tenantId);
      await this.tenantService.deleteTenant(tenantId);
      this.logger.log(`Tenant ${tenantId} deprovisioned cleanly.`);
    } catch (error: any) {
      throw new TenantException(
        TenantErrorCode.INVALID_TENANT_CONTEXT,
        `Failed to deprovision tenant: ${error.message}`,
      );
    }
  }

  private async dropTenantDatabase(databaseName: string): Promise<void> {
    const sequelize = this.getPlatformMasterSequelize();
    try {
      await sequelize.query(`
        SELECT pg_terminate_backend(pg_stat_activity.pid)
        FROM pg_stat_activity
        WHERE pg_stat_activity.datname = '${databaseName}'
        AND pid <> pg_backend_pid();
      `);
      await sequelize.query(`DROP DATABASE IF EXISTS "${databaseName}";`);
    } finally {
      await sequelize.close();
    }
  }

  private getPlatformMasterSequelize(): Sequelize {
    return new Sequelize({
      host: process.env.TENANT_DB_HOST || 'localhost',
      port: parseInt(process.env.TENANT_DB_PORT || '5432'),
      username: process.env.TENANT_DB_USER || 'postgres',
      password: process.env.TENANT_DB_PASSWORD || 'password',
      dialect: 'postgres',
      logging: false,
    });
  }
}
