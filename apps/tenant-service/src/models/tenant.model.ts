import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  IsUUID,
  Default,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';

export enum TenantStatus {
  DRAFT = 'DRAFT',
  PENDING_SUBSCRIPTION = 'PENDING_SUBSCRIPTION',
  PENDING_ADMIN_ACTIVATION = 'PENDING_ADMIN_ACTIVATION',
  SETUP_IN_PROGRESS = 'SETUP_IN_PROGRESS',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  EXPIRED = 'EXPIRED',
}

export enum TenantSetupStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export enum TenantProvisioningStatus {
  PENDING = 'PENDING',
  PROVISIONING = 'PROVISIONING',
  READY = 'READY',
  FAILED = 'FAILED',
}

@Table({ tableName: 'tenants' })
export class Tenant extends Model {
  @IsUUID(4)
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column
  declare id: string;

  @Column({ allowNull: false })
  declare name: string;

  @Column({ allowNull: true })
  declare organizationName: string;

  @Column({ allowNull: true })
  declare legalName: string;

  @Column({ allowNull: true })
  declare industry: string;

  @Column({ allowNull: true })
  declare phone: string;

  @Column({ allowNull: true })
  declare website: string;

  @Column({ allowNull: true })
  declare country: string;

  @Column({ allowNull: true })
  declare state: string;

  @Column({ allowNull: true })
  declare city: string;

  @Column({ allowNull: true })
  declare address: string;

  @Column({ allowNull: true })
  declare timezone: string;

  @Column({ allowNull: true })
  declare currency: string;

  @Column({ unique: true, allowNull: true })
  declare slug: string;

  @Column({ allowNull: true })
  declare email: string;

  @Column({ allowNull: true })
  declare adminEmail: string;

  @Default('standard')
  @Column({ allowNull: true })
  declare planType: string;

  @Column({ unique: true, allowNull: true })
  declare domain: string;

  @Default(true)
  @Column
  declare isActive: boolean;

  @Default(TenantStatus.DRAFT)
  @Column({
    type: DataType.ENUM(...Object.values(TenantStatus)),
    defaultValue: TenantStatus.DRAFT,
  })
  declare status: TenantStatus;

  @Default(TenantSetupStatus.NOT_STARTED)
  @Column({
    type: DataType.ENUM(...Object.values(TenantSetupStatus)),
    defaultValue: TenantSetupStatus.NOT_STARTED,
  })
  declare setupStatus: TenantSetupStatus;

  @Default(TenantProvisioningStatus.PENDING)
  @Column({
    type: DataType.ENUM(...Object.values(TenantProvisioningStatus)),
    defaultValue: TenantProvisioningStatus.PENDING,
  })
  declare provisioningStatus: TenantProvisioningStatus;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare provisioningError: string;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
