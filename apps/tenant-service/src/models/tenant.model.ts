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
} from 'sequelize-typescript';

@Table({ tableName: 'tenants' })
export class Tenant extends Model {
  @IsUUID(4)
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column
  declare id: string;

  @Column({ allowNull: false })
  declare name: string;

  @Column({ allowNull: true })
  declare organizationName: string;

  @Column({ allowNull: true })
  declare email: string;

  @Default('standard')
  @Column({ allowNull: true })
  declare planType: string;

  @Column({ unique: true, allowNull: true })
  declare domain: string;

  @Default(true)
  @Column
  declare isActive: boolean;

  @Default('active')
  @Column
  declare status: string;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
