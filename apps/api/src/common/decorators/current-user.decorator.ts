import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import type { Request } from 'express';

export type AuthenticatedUser = {
  userId: string;
  tenantId: string;
  email: string;
  roles: string[]; // role types e.g. ["OWNER"]
  permissions: string[]; // permission keys e.g. ["channel:create"]
  jti?: string;
};

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    if (!request.user) {
      throw new Error('No user on request — JwtAuthGuard not applied?');
    }
    return request.user;
  },
);

export const CurrentTenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    if (!request.user) {
      throw new Error('No user on request — JwtAuthGuard not applied?');
    }
    return request.user.tenantId;
  },
);
