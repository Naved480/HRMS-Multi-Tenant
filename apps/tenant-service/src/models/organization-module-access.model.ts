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
  Index,
} from 'sequelize-typescript';
import { Tenant } from './tenant.model';

@Table({
  tableName: 'organization_module_access',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['tenantId', 'moduleKey'],
      name: 'unique_tenant_module_access',
    },
  ],
})
export class OrganizationModuleAccess extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @ForeignKey(() => Tenant)
  @Index('unique_tenant_module_access')
  @Column({ type: DataType.UUID, allowNull: false })
  declare tenantId: string;

  @BelongsTo(() => Tenant)
  declare tenant: Tenant;

  @Index('unique_tenant_module_access')
  @Column({ type: DataType.STRING, allowNull: false })
  declare moduleKey: string;

  @Default(true)
  @Column({ type: DataType.BOOLEAN, allowNull: false })
  declare enabled: boolean;

  @Column({ type: DataType.JSON, allowNull: true })
  declare allowedActions: string[];

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
