import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

export interface HealthStatus {
  status: 'ok';
  database: 'up';
  timestamp: string;
}

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async check(): Promise<HealthStatus> {
    await this.prisma.$queryRaw<Array<{ health: number }>>`SELECT 1 AS health`;

    return {
      status: 'ok',
      database: 'up',
      timestamp: new Date().toISOString()
    };
  }
}
