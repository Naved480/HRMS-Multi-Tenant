import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  IsUUID,
  Default,
  ForeignKey,
} from 'sequelize-typescript';
import { Tenant } from './tenant.model';

@Table({ tableName: 'designations' })
export class Designation extends Model {
  @IsUUID(4)
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column
  declare id: string;

  @ForeignKey(() => Tenant)
  @Column({ allowNull: false })
  declare tenantId: string;

  @Column({ allowNull: false })
  declare title: string;
}
