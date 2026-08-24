import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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

  @ApiProperty({ example: 'acme-enterprises', required: false })
  @IsString()
  @IsOptional()
  domain?: string;

  @ApiProperty({ example: '50-100', required: false })
  @IsString()
  @IsOptional()
  teamStrength?: string;
}
