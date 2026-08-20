import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  CreatedAt,
  UpdatedAt,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Tenant } from './tenant.model';

@Table({ tableName: 'tenant_database_configs', timestamps: true })
export class TenantDatabaseConfig extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @ForeignKey(() => Tenant)
  @Column({ type: DataType.UUID, allowNull: false, unique: true })
  declare tenantId: string;

  @BelongsTo(() => Tenant)
  declare tenant: Tenant;

  @Column({ type: DataType.STRING, allowNull: false })
  declare databaseName: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare host: string;

  @Column({ type: DataType.INTEGER, allowNull: false })
  declare port: number;

  @Column({ type: DataType.STRING, allowNull: false })
  declare username: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare password: string;

  @Column({ type: DataType.ENUM('postgres', 'mysql'), defaultValue: 'postgres' })
  declare dialect: 'postgres' | 'mysql';

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  declare isActive: boolean;

  @Column({ type: DataType.JSON, allowNull: true })
  declare poolConfig: {
    max: number;
    min: number;
    idle: number;
  };

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
