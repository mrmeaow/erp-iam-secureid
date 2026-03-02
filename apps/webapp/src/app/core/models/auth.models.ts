export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  name: string;
  companyName: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  tenantId: string;
  jti: string;
  isVerified: boolean;
  iat: number;
  exp: number;
}

export interface UserProfile {
  sub: string;
  email: string;
  tenantId: string;
  isVerified: boolean;
}
