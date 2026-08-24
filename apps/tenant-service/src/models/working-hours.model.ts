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

@Table({ tableName: 'working_hours', timestamps: true })
export class WorkingHours extends Model {
  @IsUUID(4)
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column
  declare id: string;

  @ForeignKey(() => Tenant)
  @Column({ allowNull: false })
  declare tenantId: string;

  @Default('Standard Office Shift')
  @Column({ allowNull: false })
  declare name: string;

  @Column({ type: DataType.ARRAY(DataType.STRING), allowNull: false })
  declare workingDays: string[];

  @Column({ allowNull: false })
  declare startTime: string;

  @Column({ allowNull: false })
  declare endTime: string;

  @Default(60)
  @Column({ type: DataType.INTEGER, defaultValue: 60 })
  declare breakDurationMinutes: number;

  @Default('UTC')
  @Column({ allowNull: false, defaultValue: 'UTC' })
  declare timezone: string;

  @Default(true)
  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  declare isDefault: boolean;

  @BelongsTo(() => Tenant)
  declare tenant: Tenant;
}
