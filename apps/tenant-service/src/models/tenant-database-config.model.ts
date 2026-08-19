import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  IsUUID,
  Default,
  ForeignKey,
  BelongsTo,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { Tenant } from './tenant.model';

@Table({ tableName: 'tenant_database_configs' })
export class TenantDatabaseConfig extends Model {
  @IsUUID(4)
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column
  declare id: string;

  @ForeignKey(() => Tenant)
  @Column({ allowNull: false, unique: true })
  declare tenantId: string;

  @Column({ allowNull: false })
  declare dbHost: string;

  @Column({ allowNull: false })
  declare dbPort: number;

  @Column({ allowNull: false })
  declare dbName: string;

  @Column({ allowNull: false })
  declare dbUsername: string;

  @Column({ allowNull: false })
  declare dbPasswordHash: string;

  @Default('active')
  @Column
  declare connectionStatus: string;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  @BelongsTo(() => Tenant)
  declare tenant: Tenant;
}
