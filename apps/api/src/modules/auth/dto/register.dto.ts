import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

/**
 * Đăng ký Owner đầu tiên cho tenant.
 * Phase 1: cho phép register chỉ khi tenant CHƯA có Owner nào.
 * Phase 3: chuyển sang invite-only flow.
 */
export class RegisterDto {
  @ApiProperty({ example: 'newowner@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'StrongPass123!', minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ example: 'Nguyễn Văn A' })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiProperty({ example: 'demo-media-co' })
  @IsString()
  tenantSlug!: string;
}
