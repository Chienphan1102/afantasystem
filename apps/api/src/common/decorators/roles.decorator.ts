import { SetMetadata } from '@nestjs/common';
import type { RoleType } from '@prisma/client';

export const ROLES_KEY = 'requiredRoles';

/** Require user to have AT LEAST ONE of the listed role types. */
export const RequireRoles = (...roles: RoleType[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_KEY, roles);
