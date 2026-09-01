import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsBoolean,
  IsNumber,
  IsArray,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateOrganizationProfileDto {
  @ApiProperty({ example: 'Acme Enterprises Inc.', required: false })
  @IsString()
  @IsOptional()
  organizationName?: string;

  @ApiProperty({ example: 'CLS', required: false })
  @IsString()
  @IsOptional()
  shortName?: string;

  @ApiProperty({ example: 'admin@clariftstudio.com', required: false })
  @IsString()
  @IsOptional()
  officialEmail?: string;

  @ApiProperty({ example: '200-500', required: false })
  @IsString()
  @IsOptional()
  companySize?: string;

  @ApiProperty({ example: 'https://example.com/logo.png', required: false })
  @IsString()
  @IsOptional()
  logoUrl?: string;

  @ApiProperty({ example: 'Acme Enterprises Legal Ltd.', required: false })
  @IsString()
  @IsOptional()
  legalName?: string;

  @ApiProperty({ example: 'Information Technology', required: false })
  @IsString()
  @IsOptional()
  industry?: string;

  @ApiProperty({ example: '+1-555-0199', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 'https://acme.example.com', required: false })
  @IsString()
  @IsOptional()
  website?: string;

  @ApiProperty({ example: 'United States', required: false })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiProperty({ example: 'California', required: false })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiProperty({ example: 'San Francisco', required: false })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({ example: '100 Market Street, Suite 500', required: false })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ example: 'America/Los_Angeles', required: false })
  @IsString()
  @IsOptional()
  timezone?: string;

  @ApiProperty({ example: 'USD', required: false })
  @IsString()
  @IsOptional()
  currency?: string;
}

export class CreateDepartmentDto {
  @ApiProperty({ example: 'Engineering' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'ENG', required: false })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiProperty({ example: 'Software development and engineering department', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateDepartmentDto {
  @ApiProperty({ example: 'Engineering & Technology', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'ENG-TECH', required: false })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiProperty({ example: 'Updated department description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class CreateDesignationDto {
  @ApiProperty({ example: 'Senior Software Engineer' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'SR-ENG', required: false })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiProperty({ example: 'Senior level software engineering role', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'd4b12f6a-04b3-4f8a-9892-9653d9e21183', required: false })
  @IsString()
  @IsOptional()
  departmentId?: string;
}

export class UpdateDesignationDto {
  @ApiProperty({ example: 'Lead Software Engineer', required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ example: 'LEAD-ENG', required: false })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiProperty({ example: 'Updated designation description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'd4b12f6a-04b3-4f8a-9892-9653d9e21183', required: false })
  @IsString()
  @IsOptional()
  departmentId?: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateWorkingHoursDto {
  @ApiProperty({ example: 'Standard Office Shift', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'] })
  @IsArray()
  @IsOptional()
  workingDays?: string[];

  @ApiProperty({ example: '09:00' })
  @IsString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({ example: '17:00' })
  @IsString()
  @IsNotEmpty()
  endTime: string;

  @ApiProperty({ example: 60, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  breakDurationMinutes?: number;

  @ApiProperty({ example: 'UTC', required: false })
  @IsString()
  @IsOptional()
  timezone?: string;
}

export class CreateLeavePolicyDto {
  @ApiProperty({ example: 'Annual Paid Leave' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Standard annual paid leave allocation', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 14 })
  @IsNumber()
  @Min(0)
  annualAllocation: number;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isPaid?: boolean;
}

export class UpdateLeavePolicyDto {
  @ApiProperty({ example: 'Annual Paid Leave', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'Updated description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 18, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  annualAllocation?: number;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isPaid?: boolean;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateAttendancePolicyDto {
  @ApiProperty({ example: 15, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  gracePeriodMinutes?: number;

  @ApiProperty({ example: 30, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  lateThresholdMinutes?: number;

  @ApiProperty({ example: 'WEB_CLOCK_IN', required: false })
  @IsString()
  @IsOptional()
  trackingMode?: string;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  allowOvertime?: boolean;
}
