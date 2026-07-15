import { describe, expect, it, vi } from 'vitest';

import { HealthService } from '../src/health/health.service';
import { PrismaService } from '../src/prisma/prisma.service';

describe('HealthService', () => {
  it('conferma la disponibilità del database', async () => {
    const prisma = {
      $queryRaw: vi.fn().mockResolvedValue([{ health: 1 }])
    };
    const service = new HealthService(prisma as unknown as PrismaService);

    const result = await service.check();

    expect(prisma.$queryRaw).toHaveBeenCalledOnce();
    expect(result).toMatchObject({ status: 'ok', database: 'up' });
    expect(Number.isNaN(Date.parse(result.timestamp))).toBe(false);
  });
});
