import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  IsUUID,
  Default,
  ForeignKey,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { Role } from './role.model';
import { Permission } from './permission.model';

@Table({ tableName: 'role_permissions', timestamps: true })
export class RolePermission extends Model {
  @IsUUID(4)
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @ForeignKey(() => Role)
  @Column({ type: DataType.UUID, allowNull: false })
  declare roleId: string;

  @ForeignKey(() => Permission)
  @Column({ type: DataType.UUID, allowNull: false })
  declare permissionId: string;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
