import { ApiProperty } from '@nestjs/swagger';
import { RoleDto } from '../../role/dto/role.dto';
import { UserDto } from '../../user/dto/user.dto';
import { TenantStatus } from '../entities/tenant.entity';

export class TenantDto {
  @ApiProperty({ description: 'The unique identifier of the tenant.' })
  tenant_id: string;

  @ApiProperty({ description: 'The name of the tenant.' })
  name: string;

  @ApiProperty({
    description: 'The primary domain associated with the tenant.',
    required: false,
  })
  domain?: string;

  @ApiProperty({
    description: 'The current status of the tenant.',
    enum: TenantStatus,
  })
  status: TenantStatus;

  @ApiProperty({ description: 'Registration date.' })
  created_at: string;
}

export class TenantMembershipDto {
  @ApiProperty({ description: 'The unique identifier of the membership.' })
  membership_id: string;

  @ApiProperty({ description: 'The user ID.' })
  user_id: string;

  @ApiProperty({ description: 'The tenant ID.' })
  tenant_id: string;

  @ApiProperty({
    description: 'The role ID assigned to the user in this tenant.',
  })
  role_id: string;

  @ApiProperty({ description: 'Whether the membership is active.' })
  is_active: boolean;

  @ApiProperty({
    description: 'Custom permissions/overrides for this member.',
    required: false,
  })
  permissions?: any;

  @ApiProperty({
    description: 'Tenant details',
    type: () => TenantDto,
    required: false,
  })
  tenant?: TenantDto;

  @ApiProperty({
    description: 'User details',
    type: () => UserDto,
    required: false,
  })
  user?: UserDto;

  @ApiProperty({
    description: 'Role details',
    type: () => RoleDto,
    required: false,
  })
  role?: RoleDto;
}

export class AddMemberDto {
  @ApiProperty({ description: 'The user ID to add.' })
  user_id: string;

  @ApiProperty({ description: 'The role ID to assign.' })
  role_id: string;

  @ApiProperty({
    description: 'Custom permissions/overrides.',
    required: false,
  })
  permissions?: any;
}
