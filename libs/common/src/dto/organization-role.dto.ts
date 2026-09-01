import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrgRoleDto {
  @ApiProperty({ example: 'Recruitment Manager', description: 'Name of the role' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'Manages candidate recruitment and interview schedules',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: ['perm-uuid-1', 'perm-uuid-2'],
    isArray: true,
    required: false,
    description: 'Array of permission IDs or keys to assign',
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  permissionIds?: string[];
}

export class UpdateOrgRoleDto {
  @ApiProperty({ example: 'Senior HR Manager', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'Updated description for HR Manager role', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}

export class AssignRolePermissionsDto {
  @ApiProperty({
    example: ['employee.view', 'employee.create', 'payroll.view'],
    isArray: true,
    description: 'Array of permission IDs or permission keys to assign to role',
  })
  @IsArray()
  @IsString({ each: true })
  permissionIds: string[];
}

export class AssignUserRolesDto {
  @ApiProperty({
    example: ['role-uuid-1', 'role-uuid-2'],
    isArray: true,
    description: 'Array of role IDs to assign to the user',
  })
  @IsArray()
  @IsString({ each: true })
  roleIds: string[];
}
