import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

import type { PublicUser } from '../../users/user.types';

type AuthenticatedRequest = Request & { user: PublicUser };

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): PublicUser => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    return request.user;
  }
);
