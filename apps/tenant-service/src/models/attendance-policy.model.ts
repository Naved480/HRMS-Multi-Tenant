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

@Table({ tableName: 'attendance_policies', timestamps: true })
export class AttendancePolicy extends Model {
  @IsUUID(4)
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column
  declare id: string;

  @ForeignKey(() => Tenant)
  @Column({ allowNull: false, unique: true })
  declare tenantId: string;

  @Default(15)
  @Column({ type: DataType.INTEGER, defaultValue: 15 })
  declare gracePeriodMinutes: number;

  @Default(30)
  @Column({ type: DataType.INTEGER, defaultValue: 30 })
  declare lateThresholdMinutes: number;

  @Default('WEB_CLOCK_IN')
  @Column({ allowNull: false, defaultValue: 'WEB_CLOCK_IN' })
  declare trackingMode: string;

  @Default(false)
  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  declare allowOvertime: boolean;

  @Default(true)
  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  declare isActive: boolean;

  @BelongsTo(() => Tenant)
  declare tenant: Tenant;
}
