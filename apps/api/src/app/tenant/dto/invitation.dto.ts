import { ApiProperty } from '@nestjs/swagger';
import { InvitationStatus } from '../entities/invitation.entity';

export class InvitationDto {
  @ApiProperty({ description: 'The unique identifier of the invitation.' })
  invitation_id: string;

  @ApiProperty({ description: 'The email of the invited user.' })
  email: string;

  @ApiProperty({ description: 'The tenant ID the user is invited to.' })
  tenant_id: string;

  @ApiProperty({ description: 'The role ID assigned in the invitation.' })
  role_id: string;

  @ApiProperty({
    description: 'Custom permissions/overrides.',
    required: false,
  })
  permissions?: any;

  @ApiProperty({ description: 'The invitation token.' })
  token: string;

  @ApiProperty({
    description: 'The invitation status.',
    enum: InvitationStatus,
  })
  status: InvitationStatus;

  @ApiProperty({ description: 'Expiration date.', required: false })
  expires_at?: string;

  @ApiProperty({ description: 'Creation date.' })
  created_at: string;
}

export class SendInviteDto {
  @ApiProperty({ description: 'The email of the invited user.' })
  email: string;

  @ApiProperty({ description: 'The role ID to assign.' })
  role_id: string;

  @ApiProperty({
    description: 'Custom permissions/overrides.',
    required: false,
  })
  permissions?: any;

  @ApiProperty({
    description: 'Expiration duration in hours.',
    default: 24,
    required: false,
  })
  expiresInHours?: number;
}
