import { ApiProperty } from '@nestjs/swagger';

export class AuthTokensDto {
  @ApiProperty({ description: 'The access token for authenticated requests' })
  accessToken: string;

  @ApiProperty({ description: 'The refresh token to obtain new access tokens' })
  refreshToken: string;
}

export class UserProfileDto {
  @ApiProperty({ description: 'The user ID' })
  sub: string;

  @ApiProperty({ description: 'The user email' })
  email: string;

  @ApiProperty({
    description: 'The tenant ID the user is currently operating in',
  })
  tenantId: string;

  @ApiProperty({ description: 'The unique session ID' })
  jti: string;

  @ApiProperty({ description: 'User roles' })
  roles: string[];

  @ApiProperty({ description: 'User permissions' })
  permissions: any[];

  @ApiProperty({ description: 'Whether the user email is verified' })
  isVerified: boolean;
}
