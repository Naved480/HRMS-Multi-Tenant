import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum HRMSModuleKey {
  DASHBOARD = 'dashboard',
  EMPLOYEE = 'employee',
  DEPARTMENTS = 'departments',
  ATTENDANCE = 'attendance',
  LEAVE_MANAGEMENT = 'leave_management',
  PAYROLL = 'payroll',
  REPORTS = 'reports',
  SETTINGS = 'settings',
  USER_MANAGEMENT = 'user_management',
  PERFORMANCE = 'performance',

  // Extensible Future Modules
  RECRUITMENT = 'recruitment',
  PROJECTS = 'projects',
  TIME_TRACKING = 'time_tracking',
  EXPENSES = 'expenses',
  ASSETS = 'assets',
  CALENDAR = 'calendar',
  MEETINGS = 'meetings',
  DOCUMENTS = 'documents',
  NOTIFICATIONS = 'notifications',
  GOALS = 'goals',
  WORKFLOWS = 'workflows',
  TICKETS = 'tickets',
  AI_ASSISTANT = 'ai_assistant',
}

export enum ModuleAction {
  ALL = 'all',
  VIEW = 'view',
  CREATE = 'create',
  EDIT = 'edit',
  DELETE = 'delete',
  EXPORT = 'export',
  MANAGE = 'manage',
}

export class ConfigureModuleAccessDto {
  @ApiProperty({ example: 'employee', enum: HRMSModuleKey })
  @IsString()
  @IsNotEmpty()
  moduleKey: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  enabled: boolean;

  @ApiProperty({
    example: ['all', 'create', 'edit', 'delete'],
    isArray: true,
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  allowedActions?: string[];
}

export class InitialAdminDetailsDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 'john.doe@acme.com' })
  @IsEmail()
  @IsNotEmpty()
  workEmail: string;

  @ApiProperty({ example: '+1234567890', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 'Technology', required: false })
  @IsString()
  @IsOptional()
  industry?: string;

  @ApiProperty({ example: 'https://example.com/photo.jpg', required: false })
  @IsString()
  @IsOptional()
  profilePhoto?: string;

  @ApiProperty({ example: '50-100', required: false })
  @IsString()
  @IsOptional()
  averageUsers?: string;

  @ApiProperty({ example: 'HR Director', required: false })
  @IsString()
  @IsOptional()
  jobTitle?: string;

  @ApiProperty({ example: 'Human Resources', required: false })
  @IsString()
  @IsOptional()
  initialDepartment?: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  sendInvitation?: boolean;

  @ApiProperty({
    example: 'Welcome to Acme HRMS! Please activate your admin account.',
    required: false,
  })
  @IsString()
  @IsOptional()
  customInvitationMessage?: string;
}

export class OrganizationScopeDto {
  @ApiProperty({ example: ['Engineering', 'HR'], isArray: true, required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  departments?: string[];

  @ApiProperty({ example: ['New York HQ', 'London Office'], isArray: true, required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  locations?: string[];

  @ApiProperty({ example: ['Backend Team', 'Frontend Team'], isArray: true, required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  teams?: string[];

  @ApiProperty({ example: ['Senior Engineer', 'HR Manager'], isArray: true, required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  designations?: string[];
}

export class CreateOrganizationOnboardingDto {
  @ApiProperty({ example: 'Acme Corporation' })
  @IsString()
  @IsNotEmpty()
  organizationName: string;

  @ApiProperty({ example: 'acme-corp', required: false })
  @IsString()
  @IsOptional()
  domain?: string;

  @ApiProperty({ type: InitialAdminDetailsDto })
  @ValidateNested()
  @Type(() => InitialAdminDetailsDto)
  adminDetails: InitialAdminDetailsDto;

  @ApiProperty({ type: [ConfigureModuleAccessDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConfigureModuleAccessDto)
  @IsOptional()
  modules?: ConfigureModuleAccessDto[];

  @ApiProperty({ type: OrganizationScopeDto, required: false })
  @ValidateNested()
  @Type(() => OrganizationScopeDto)
  @IsOptional()
  scope?: OrganizationScopeDto;
}

export class ValidateOrganizationOnboardingDto extends CreateOrganizationOnboardingDto {}

export class UpdateOrganizationModuleAccessDto {
  @ApiProperty({ type: [ConfigureModuleAccessDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConfigureModuleAccessDto)
  modules: ConfigureModuleAccessDto[];
}
