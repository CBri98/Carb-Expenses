import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { toPublicUser } from '../../users/user.mapper';
import type { PublicUser } from '../../users/user.types';
import { UsersService } from '../../users/users.service';
import type { JwtAccessPayload } from '../auth.types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly usersService: UsersService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      algorithms: ['HS256']
    });
  }

  async validate(payload: JwtAccessPayload): Promise<PublicUser> {
    if (payload.type !== 'access') {
      throw new UnauthorizedException('Token di accesso non valido');
    }

    const user = await this.usersService.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('Sessione non valida');
    }

    return toPublicUser(user);
  }
}
