import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  IsUUID,
  Default,
} from 'sequelize-typescript';

@Table({ tableName: 'super_admins' })
export class SuperAdmin extends Model {
  @IsUUID(4)
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column
  declare id: string;

  @Column({ allowNull: false, unique: true })
  declare email: string;

  @Column({ allowNull: false })
  declare passwordHash: string;

  @Column
  declare name: string;

  @Column
  declare resetOtp: string;

  @Column(DataType.DATE)
  declare resetOtpExpiresAt: Date;

  @Column(DataType.ARRAY(DataType.STRING))
  declare passwordHistory: string[];

  @Default('active')
  @Column
  declare status: string;
}
