import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAdminInvitationDto {
  @ApiProperty({ example: 'admin@acme-enterprises.com' })
  @IsEmail()
  @IsNotEmpty()
  adminEmail: string;

  @ApiProperty({ example: 'Alice Smith', required: false })
  @IsString()
  @IsOptional()
  adminName?: string;
}

export class ActivateAdminDto {
  @ApiProperty({ example: 'a1b2c3d4e5f6...' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ example: 'SecureAdminPass123!' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'SecureAdminPass123!' })
  @IsString()
  @MinLength(6)
  confirmPassword: string;

  @ApiProperty({ example: 'Alice', required: false })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiProperty({ example: 'Smith', required: false })
  @IsString()
  @IsOptional()
  lastName?: string;
}
