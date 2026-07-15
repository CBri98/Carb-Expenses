import type { PublicUser } from '../users/user.types';

export interface JwtAccessPayload {
  sub: string;
  email: string;
  type: 'access';
}

export interface JwtRefreshPayload {
  sub: string;
  jti: string;
  type: 'refresh';
}

export interface AuthResponse {
  user: PublicUser;
  accessToken: string;
}

export interface AuthSession extends AuthResponse {
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  refreshTokenId: string;
  refreshTokenHash: string;
  refreshTokenExpiresAt: Date;
}
