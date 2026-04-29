import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import type { JwtPayload } from './strategies/jwt.strategy';
import { LoginDto, LoginResponseDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RoleType } from '@prisma/client';

const ACCESS_EXPIRES_SECONDS = 60 * 60; // 1h
const REFRESH_EXPIRES_SECONDS = 60 * 60 * 24 * 7; // 7d
const BCRYPT_COST = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly redis: RedisService,
    private readonly config: ConfigService,
  ) {}

  // ─────────────────────────────────────────────────────────────
  // LOGIN
  // ─────────────────────────────────────────────────────────────
  async login(dto: LoginDto): Promise<LoginResponseDto> {
    const tenant = await this.findTenantBySlugOrFirst(dto.tenantSlug);

    const user = await this.prisma.user.findUnique({
      where: { tenantId_email: { tenantId: tenant.id, email: dto.email } },
      include: {
        userRoles: {
          include: {
            role: { include: { permissions: { include: { permission: true } } } },
          },
        },
      },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    const passwordOk = await bcrypt.compare(dto.password, user.hashedPassword);
    if (!passwordOk) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    const { roles, permissions } = this.flattenRolesAndPermissions(user.userRoles);

    const accessToken = await this.signAccessToken({
      sub: user.id,
      tenantId: user.tenantId,
      email: user.email,
      roles,
      permissions,
    });
    const refreshToken = await this.signRefreshToken({
      sub: user.id,
      tenantId: user.tenantId,
      email: user.email,
      roles,
      permissions,
    });

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: ACCESS_EXPIRES_SECONDS,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        tenantId: user.tenantId,
        roles,
        permissions,
        mustChangePassword: user.mustChangePassword,
      },
    };
  }

  // ─────────────────────────────────────────────────────────────
  // REGISTER (Phase 1: cho phép tạo OWNER đầu tiên cho tenant nếu chưa có)
  // ─────────────────────────────────────────────────────────────
  async register(dto: RegisterDto): Promise<LoginResponseDto> {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug: dto.tenantSlug } });
    if (!tenant) {
      throw new BadRequestException(`Tenant slug "${dto.tenantSlug}" không tồn tại`);
    }

    const ownerRole = await this.prisma.role.findFirst({
      where: { tenantId: tenant.id, type: RoleType.OWNER },
    });
    if (!ownerRole) {
      throw new BadRequestException('Tenant chưa có role OWNER được seed');
    }

    const existingOwner = await this.prisma.userRole.findFirst({
      where: { roleId: ownerRole.id, groupId: null },
    });
    if (existingOwner) {
      throw new ConflictException(
        'Tenant này đã có Owner. Phase 1 chỉ cho phép register Owner đầu tiên.',
      );
    }

    const existingEmail = await this.prisma.user.findUnique({
      where: { tenantId_email: { tenantId: tenant.id, email: dto.email } },
    });
    if (existingEmail) {
      throw new ConflictException('Email này đã tồn tại trong tenant');
    }

    const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_COST);
    const user = await this.prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: dto.email,
        hashedPassword,
        fullName: dto.fullName ?? null,
        isActive: true,
      },
    });

    await this.prisma.userRole.create({
      data: { userId: user.id, roleId: ownerRole.id, groupId: null },
    });

    return this.login({ email: dto.email, password: dto.password, tenantSlug: dto.tenantSlug });
  }

  // ─────────────────────────────────────────────────────────────
  // REFRESH
  // ─────────────────────────────────────────────────────────────
  async refresh(refreshToken: string): Promise<LoginResponseDto> {
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Refresh token không hợp lệ hoặc đã hết hạn');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Token type phải là "refresh"');
    }

    if (payload.jti) {
      const blacklisted = await this.redis.isBlacklisted(payload.jti);
      if (blacklisted) {
        throw new UnauthorizedException('Refresh token đã bị revoke (logout)');
      }
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        userRoles: {
          include: {
            role: { include: { permissions: { include: { permission: true } } } },
          },
        },
      },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User không tồn tại hoặc bị disable');
    }

    const { roles, permissions } = this.flattenRolesAndPermissions(user.userRoles);

    const newAccess = await this.signAccessToken({
      sub: user.id,
      tenantId: user.tenantId,
      email: user.email,
      roles,
      permissions,
    });
    const newRefresh = await this.signRefreshToken({
      sub: user.id,
      tenantId: user.tenantId,
      email: user.email,
      roles,
      permissions,
    });

    return {
      accessToken: newAccess,
      refreshToken: newRefresh,
      expiresIn: ACCESS_EXPIRES_SECONDS,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        tenantId: user.tenantId,
        roles,
        permissions,
        mustChangePassword: user.mustChangePassword,
      },
    };
  }

  // ─────────────────────────────────────────────────────────────
  // LOGOUT
  // ─────────────────────────────────────────────────────────────
  async logout(refreshToken: string): Promise<{ success: boolean }> {
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
      });
    } catch {
      // Even if invalid, return success (idempotent logout)
      return { success: true };
    }

    if (payload.jti && payload.exp) {
      const remainingTtl = Math.max(0, payload.exp - Math.floor(Date.now() / 1000));
      if (remainingTtl > 0) {
        await this.redis.blacklistRefreshToken(payload.jti, remainingTtl);
      }
    }

    return { success: true };
  }

  // ─────────────────────────────────────────────────────────────
  // GET CURRENT USER
  // ─────────────────────────────────────────────────────────────
  async getMe(userId: string): Promise<LoginResponseDto['user'] & { lastLoginAt: Date | null }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: { include: { permissions: { include: { permission: true } } } },
          },
        },
      },
    });
    if (!user) throw new UnauthorizedException('User không tồn tại');
    const { roles, permissions } = this.flattenRolesAndPermissions(user.userRoles);
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      tenantId: user.tenantId,
      roles,
      permissions,
      mustChangePassword: user.mustChangePassword,
      lastLoginAt: user.lastLoginAt,
    };
  }

  // ─────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────
  private async findTenantBySlugOrFirst(slug?: string): Promise<{ id: string; slug: string }> {
    if (slug) {
      const t = await this.prisma.tenant.findUnique({ where: { slug } });
      if (!t) throw new UnauthorizedException(`Tenant "${slug}" không tồn tại`);
      return t;
    }
    // Phase 1 fallback: chỉ có 1 tenant
    const tenants = await this.prisma.tenant.findMany({ take: 2 });
    if (tenants.length === 0) {
      throw new UnauthorizedException('Hệ thống chưa có tenant nào — chạy `pnpm prisma db seed`');
    }
    if (tenants.length > 1) {
      throw new BadRequestException('Có nhiều tenant — vui lòng truyền tenantSlug');
    }
    return tenants[0];
  }

  private flattenRolesAndPermissions(
    userRoles: Array<{
      role: {
        type: RoleType;
        permissions: Array<{ permission: { key: string } }>;
      };
    }>,
  ): { roles: string[]; permissions: string[] } {
    const roles = new Set<string>();
    const permissions = new Set<string>();
    for (const ur of userRoles) {
      roles.add(ur.role.type);
      for (const rp of ur.role.permissions) {
        permissions.add(rp.permission.key);
      }
    }
    return { roles: [...roles], permissions: [...permissions] };
  }

  private signAccessToken(p: Omit<JwtPayload, 'type' | 'jti' | 'iat' | 'exp'>): Promise<string> {
    return this.jwt.signAsync(
      { ...p, type: 'access', jti: uuidv4() },
      {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
        expiresIn: ACCESS_EXPIRES_SECONDS,
      },
    );
  }

  private signRefreshToken(p: Omit<JwtPayload, 'type' | 'jti' | 'iat' | 'exp'>): Promise<string> {
    return this.jwt.signAsync(
      { ...p, type: 'refresh', jti: uuidv4() },
      {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
        expiresIn: REFRESH_EXPIRES_SECONDS,
      },
    );
  }
}
