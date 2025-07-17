import { User, Role } from '@prisma/client';

export interface JwtPayload {
  sub: string; // user ID
  email: string;
  role: Role;
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export type UserWithoutPassword = Omit<User, 'password'>;
