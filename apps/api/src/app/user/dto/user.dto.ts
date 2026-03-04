import { ApiProperty } from '@nestjs/swagger';

export class UserDto {
  @ApiProperty({ description: 'The unique identifier of the user.' })
  user_id: string;

  @ApiProperty({ description: 'The email address of the user.' })
  email: string;

  @ApiProperty({ description: 'The full name of the user.', required: false })
  name?: string;

  @ApiProperty({ description: 'Indicates if the user account is active.' })
  is_active: boolean;

  @ApiProperty({ description: 'Indicates if the email has been verified.' })
  is_verified: boolean;

  @ApiProperty({ description: 'The last login timestamp.', required: false })
  last_login?: string;

  @ApiProperty({ description: 'Creation date.' })
  created_at: string;
}
