import { ApiProperty } from '@nestjs/swagger';

export class AuditLogDto {
  @ApiProperty({ description: 'The unique identifier of the audit log.' })
  id: string;

  @ApiProperty({ description: 'The action performed.' })
  action: string;

  @ApiProperty({
    description: 'The ID of the user who performed the action.',
    required: false,
  })
  actor_id?: string;

  @ApiProperty({
    description: 'The email of the user who performed the action.',
    required: false,
  })
  actor_email?: string;

  @ApiProperty({
    description: 'The tenant ID where the action was performed.',
    required: false,
  })
  tenant_id?: string;

  @ApiProperty({
    description: 'The type of resource affected.',
    required: false,
  })
  resource_type?: string;

  @ApiProperty({
    description: 'The ID of the resource affected.',
    required: false,
  })
  resource_id?: string;

  @ApiProperty({
    description: 'Additional metadata related to the action.',
    required: false,
  })
  payload?: any;

  @ApiProperty({
    description: 'The IP address of the user who performed the action.',
    required: false,
  })
  ip_address?: string;

  @ApiProperty({
    description: 'The user agent of the user who performed the action.',
    required: false,
  })
  user_agent?: string;

  @ApiProperty({ description: 'The timestamp when the action was performed.' })
  created_at: string;
}
