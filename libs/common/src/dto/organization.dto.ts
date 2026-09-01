import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export * from './organization-module.dto';

export class CreateOrganizationDto {
  @ApiProperty({ example: 'Acme Enterprises' })
  @IsString()
  @IsNotEmpty()
  organizationName: string;

  @ApiProperty({ example: 'admin@acme-enterprises.com' })
  @IsEmail()
  @IsNotEmpty()
  adminEmail: string;

  @ApiProperty({ example: 'John Doe', required: false })
  @IsString()
  @IsOptional()
  adminName?: string;

  @ApiProperty({ example: 'John', required: false })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiProperty({ example: 'Doe', required: false })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({ example: 'acme-enterprises', required: false })
  @IsString()
  @IsOptional()
  domain?: string;

  @ApiProperty({ example: '50-100', required: false })
  @IsString()
  @IsOptional()
  teamStrength?: string;

  @ApiProperty({ example: '50-100', required: false })
  @IsString()
  @IsOptional()
  averageUsers?: string;

  @ApiProperty({ example: 'Technology', required: false })
  @IsString()
  @IsOptional()
  industry?: string;

  @ApiProperty({ example: '+1234567890', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  sendInvitation?: boolean;

  @ApiProperty({ example: 'Welcome to HRMS', required: false })
  @IsString()
  @IsOptional()
  customInvitationMessage?: string;
}
