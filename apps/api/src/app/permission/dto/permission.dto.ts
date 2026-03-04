import { ApiProperty } from '@nestjs/swagger';

export class PermissionDto {
  @ApiProperty({ description: 'The unique identifier of the permission.' })
  permission_id: string;

  @ApiProperty({ description: 'The resource this permission applies to.' })
  resource: string;

  @ApiProperty({ description: 'The action allowed on the resource.' })
  action: string;

  @ApiProperty({
    description: 'A human-readable label for the permission.',
    required: false,
  })
  label?: string;

  @ApiProperty({
    description: 'The group this permission belongs to.',
    required: false,
  })
  group?: string;

  @ApiProperty({ description: 'Creation date.' })
  created_at: string;
}
