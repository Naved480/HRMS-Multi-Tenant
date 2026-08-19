import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterTenantDto {
  @ApiProperty({ example: 'Acme Corp' })
  @IsString()
  @IsNotEmpty()
  companyName: string;

  @ApiProperty({ example: 'acme' })
  @IsString()
  @IsNotEmpty()
  domain: string;

  @ApiProperty({ example: 'admin@acme.com' })
  @IsEmail()
  @IsNotEmpty()
  adminEmail: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  lastName: string;
}

export class LoginDto {
  @ApiProperty({ example: 'admin@acme.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class SuperAdminLoginDto {
  @ApiProperty({ example: 'superadmin@system.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'SuperSecret123!' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class OnboardOrganizationDto {
  @ApiProperty({ example: 'Acme Global' })
  @IsString()
  @IsNotEmpty()
  companyName: string;

  @ApiProperty({ example: 'acme-global' })
  @IsString()
  @IsNotEmpty()
  domain: string;

  @ApiProperty({ example: 'orgadmin@acme.com' })
  @IsEmail()
  @IsNotEmpty()
  adminEmail: string;

  @ApiProperty({ example: 'AdminPass123!' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Alice' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Smith' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 'localhost', required: false })
  @IsString()
  dbHost?: string;

  @ApiProperty({ example: 5432, required: false })
  dbPort?: number;

  @ApiProperty({ example: 'hrms_acme_db', required: false })
  @IsString()
  dbName?: string;

  @ApiProperty({ example: 'postgres', required: false })
  @IsString()
  dbUsername?: string;

  @ApiProperty({ example: 'postgres', required: false })
  @IsString()
  dbPassword?: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'aasma@astraprotocol.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: 'aasma@astraprotocol.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty()
  otp: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'aasma@astraprotocol.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty()
  otp: string;

  @ApiProperty({ example: 'NewSecurePassword123!' })
  @IsString()
  @MinLength(6)
  newPassword: string;

  @ApiProperty({ example: 'NewSecurePassword123!' })
  @IsString()
  @MinLength(6)
  confirmPassword: string;
}

