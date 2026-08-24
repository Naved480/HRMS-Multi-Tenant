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
} from 'sequelize-typescript';
import { Tenant } from './tenant.model';

@Table({ tableName: 'leave_policies', timestamps: true })
export class LeavePolicy extends Model {
  @IsUUID(4)
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column
  declare id: string;

  @ForeignKey(() => Tenant)
  @Column({ allowNull: false })
  declare tenantId: string;

  @Column({ allowNull: false })
  declare name: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare description: string;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 14 })
  declare annualAllocation: number;

  @Default(true)
  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  declare isPaid: boolean;

  @Default(true)
  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  declare isActive: boolean;

  @BelongsTo(() => Tenant)
  declare tenant: Tenant;
}
