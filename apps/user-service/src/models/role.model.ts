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
  BelongsToMany,
} from 'sequelize-typescript';
import { User } from './user.model';
import { UserRole } from './user-role.model';
import { Permission } from './permission.model';
import { RolePermission } from './role-permission.model';

@Table({ tableName: 'roles', timestamps: true })
export class Role extends Model {
  @IsUUID(4)
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  declare name: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare description: string;

  @Default(false)
  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  declare isSystemRole: boolean;

  @BelongsToMany(() => User, () => UserRole)
  declare users: User[];

  @BelongsToMany(() => Permission, () => RolePermission)
  declare permissions: Permission[];

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
