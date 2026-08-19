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
import { Role } from './role.model';

@Table({ tableName: 'users' })
export class User extends Model {
  @IsUUID(4)
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column
  declare id: string;

  @Column({ allowNull: false })
  declare tenantId: string;

  @Column({ allowNull: false, unique: true })
  declare email: string;

  @ForeignKey(() => Role)
  @Column
  declare roleId: string;

  @Default(true)
  @Column
  declare isActive: boolean;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  @BelongsTo(() => Role)
  declare role: Role;
}
