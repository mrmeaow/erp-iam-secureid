export type JwtPayload = {
  sub: string;
  email: string;
  tenantId: string;
  jti: string;
  isVerified: boolean;
};

export type AuthToken = {
  accessToken: string;
  refreshToken: string;
};

export type AuthSession = {
  userId: string;
  tenantId: string;
  iat: number;
  exp: number;
};
