import { Injectable } from '@nestjs/common';
import type { User } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { defaultPreferenceData } from '../settings/settings.defaults';
import type { CreateUserInput } from './user.types';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  create(input: CreateUserInput): Promise<User> {
    return this.prisma.user.create({
      data: { ...input, preference: { create: defaultPreferenceData() } },
    });
  }
}
