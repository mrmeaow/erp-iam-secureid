import { ApiProperty } from '@nestjs/swagger';
import { PermissionDto } from '../../permission/dto/permission.dto';

export class RoleDto {
  @ApiProperty({ description: 'The unique identifier of the role.' })
  role_id: string;

  @ApiProperty({ description: 'The tenant ID this role belongs to.' })
  tenant_id: string;

  @ApiProperty({ description: 'The name of the role.' })
  name: string;

  @ApiProperty({ description: 'The description of the role.', required: false })
  description?: string;

  @ApiProperty({
    description: 'List of permissions assigned to this role.',
    type: [PermissionDto],
    required: false,
  })
  permissions?: PermissionDto[];

  @ApiProperty({ description: 'Creation date.' })
  created_at: string;
}

export class CreateRoleDto {
  @ApiProperty({ description: 'The name of the role.' })
  name: string;

  @ApiProperty({ description: 'The description of the role.', required: false })
  description?: string;
}

export class AssignPermissionsDto {
  @ApiProperty({
    description: 'List of permission IDs to assign.',
    type: [String],
  })
  permission_ids: string[];
}
