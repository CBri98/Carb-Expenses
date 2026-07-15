import type { User } from '@prisma/client';

export type PublicUser = Omit<User, 'passwordHash'>;

export interface CreateUserInput {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName?: string;
  currency: string;
  timezone: string;
}
