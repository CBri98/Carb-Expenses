import {
  ConflictException,
  Injectable,
  UnauthorizedException
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import type { User } from '@prisma/client';
import { argon2id, hash, verify } from 'argon2';
import { randomUUID } from 'node:crypto';

import { PrismaService } from '../prisma/prisma.service';
import { toPublicUser } from '../users/user.mapper';
import { UsersService } from '../users/users.service';
import type { AuthSession, JwtRefreshPayload, TokenPair } from './auth.types';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';
import { durationToMilliseconds } from './token-duration';

const ARGON_OPTIONS = {
  type: argon2id,
  memoryCost: 65_536,
  timeCost: 3,
  parallelism: 1
} as const;

@Injectable()
export class AuthService {
  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  private readonly accessExpiresIn: string;
  private readonly refreshExpiresIn: string;
  private readonly defaultCurrency: string;
  private readonly defaultTimezone: string;

  constructor(
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    config: ConfigService
  ) {
    this.accessSecret = config.getOrThrow<string>('JWT_ACCESS_SECRET');
    this.refreshSecret = config.getOrThrow<string>('JWT_REFRESH_SECRET');
    this.accessExpiresIn = config.getOrThrow<string>('JWT_ACCESS_EXPIRES_IN');
    this.refreshExpiresIn = config.getOrThrow<string>('JWT_REFRESH_EXPIRES_IN');
    this.defaultCurrency = config.getOrThrow<string>('DEFAULT_CURRENCY');
    this.defaultTimezone = config.getOrThrow<string>('DEFAULT_TIMEZONE');
  }

  async register(dto: RegisterDto): Promise<AuthSession> {
    const email = dto.email.trim().toLowerCase();
    const existingUser = await this.usersService.findByEmail(email);

    if (existingUser) {
      throw new ConflictException('Esiste già un account associato a questa email');
    }

    const passwordHash = await hash(dto.password, ARGON_OPTIONS);

    try {
      const user = await this.usersService.create({
        email,
        passwordHash,
        firstName: dto.firstName.trim(),
        ...(dto.lastName ? { lastName: dto.lastName.trim() } : {}),
        currency: this.defaultCurrency,
        timezone: this.defaultTimezone
      });

      return this.createSession(user);
    } catch (error: unknown) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('Esiste già un account associato a questa email');
      }

      throw error;
    }
  }

  async login(dto: LoginDto): Promise<AuthSession> {
    const email = dto.email.trim().toLowerCase();
    const user = await this.usersService.findByEmail(email);

    if (!user || !(await safeVerify(user.passwordHash, dto.password))) {
      throw new UnauthorizedException('Email o password non corretti');
    }

    return this.createSession(user);
  }

  async refresh(refreshToken: string | undefined): Promise<AuthSession> {
    const payload = await this.verifyRefreshToken(refreshToken);
    const token = refreshToken as string;
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { id: payload.jti },
      include: { user: true }
    });

    if (
      !storedToken ||
      storedToken.userId !== payload.sub ||
      storedToken.revokedAt !== null ||
      storedToken.expiresAt.getTime() <= Date.now() ||
      !(await safeVerify(storedToken.tokenHash, token))
    ) {
      throw new UnauthorizedException('Refresh token non valido o già utilizzato');
    }

    const tokens = await this.buildTokenPair(storedToken.user);

    await this.prisma.$transaction(async (transaction) => {
      const revoked = await transaction.refreshToken.updateMany({
        where: {
          id: storedToken.id,
          userId: storedToken.userId,
          revokedAt: null
        },
        data: { revokedAt: new Date() }
      });

      if (revoked.count !== 1) {
        throw new UnauthorizedException('Refresh token non valido o già utilizzato');
      }

      await transaction.refreshToken.create({
        data: {
          id: tokens.refreshTokenId,
          userId: storedToken.userId,
          tokenHash: tokens.refreshTokenHash,
          expiresAt: tokens.refreshTokenExpiresAt
        }
      });
    });

    return this.toSession(storedToken.user, tokens);
  }

  async logout(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) {
      return;
    }

    let payload: JwtRefreshPayload;

    try {
      payload = await this.verifyRefreshToken(refreshToken);
    } catch {
      return;
    }

    await this.prisma.refreshToken.updateMany({
      where: {
        id: payload.jti,
        userId: payload.sub,
        revokedAt: null
      },
      data: { revokedAt: new Date() }
    });
  }

  verifyPassword(user: Pick<User, 'passwordHash'>, password: string): Promise<boolean> {
    return safeVerify(user.passwordHash, password);
  }

  hashPassword(password: string): Promise<string> {
    return hash(password, ARGON_OPTIONS);
  }

  async revokeOtherSessions(
    userId: string,
    refreshToken: string | undefined,
  ): Promise<{ revokedCount: number; currentSessionRetained: boolean }> {
    let currentTokenId: string | null = null;
    if (refreshToken) {
      try {
        const payload = await this.verifyRefreshToken(refreshToken);
        if (payload.sub === userId) currentTokenId = payload.jti;
      } catch {
        currentTokenId = null;
      }
    }
    const result = await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
        ...(currentTokenId ? { id: { not: currentTokenId } } : {}),
      },
      data: { revokedAt: new Date() },
    });
    return {
      revokedCount: result.count,
      currentSessionRetained: currentTokenId !== null,
    };
  }

  async revokeAllSessions(userId: string): Promise<number> {
    const result = await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return result.count;
  }

  private async createSession(user: User): Promise<AuthSession> {
    const tokens = await this.buildTokenPair(user);

    await this.prisma.refreshToken.create({
      data: {
        id: tokens.refreshTokenId,
        userId: user.id,
        tokenHash: tokens.refreshTokenHash,
        expiresAt: tokens.refreshTokenExpiresAt
      }
    });

    return this.toSession(user, tokens);
  }

  private async buildTokenPair(user: User): Promise<TokenPair> {
    const refreshTokenId = randomUUID();
    const refreshTokenExpiresAt = new Date(
      Date.now() + durationToMilliseconds(this.refreshExpiresIn)
    );
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: user.id, email: user.email, type: 'access' },
        {
          secret: this.accessSecret,
          algorithm: 'HS256',
          expiresIn: this.accessExpiresIn as JwtSignOptions['expiresIn']
        }
      ),
      this.jwtService.signAsync(
        { sub: user.id, jti: refreshTokenId, type: 'refresh' },
        {
          secret: this.refreshSecret,
          algorithm: 'HS256',
          expiresIn: this.refreshExpiresIn as JwtSignOptions['expiresIn']
        }
      )
    ]);
    const refreshTokenHash = await hash(refreshToken, ARGON_OPTIONS);

    return {
      accessToken,
      refreshToken,
      refreshTokenId,
      refreshTokenHash,
      refreshTokenExpiresAt
    };
  }

  private async verifyRefreshToken(
    refreshToken: string | undefined
  ): Promise<JwtRefreshPayload> {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token mancante');
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtRefreshPayload>(refreshToken, {
        secret: this.refreshSecret,
        algorithms: ['HS256']
      });

      if (
        payload.type !== 'refresh' ||
        typeof payload.sub !== 'string' ||
        typeof payload.jti !== 'string'
      ) {
        throw new UnauthorizedException('Refresh token non valido');
      }

      return payload;
    } catch {
      throw new UnauthorizedException('Refresh token non valido o scaduto');
    }
  }

  private toSession(user: User, tokens: TokenPair): AuthSession {
    return {
      user: toPublicUser(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      refreshTokenExpiresAt: tokens.refreshTokenExpiresAt
    };
  }
}

async function safeVerify(hashValue: string, value: string): Promise<boolean> {
  try {
    return await verify(hashValue, value);
  } catch {
    return false;
  }
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'P2002'
  );
}
