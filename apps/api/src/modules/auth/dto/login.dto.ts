import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'chienphan.jup@gmail.com', description: 'Email của user' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'ChangeMe123!', minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiPropertyOptional({
    example: 'demo-media-co',
    description: 'Slug của tenant (Phase 1 có 1 tenant nên có thể bỏ trống)',
  })
  @IsOptional()
  @IsString()
  tenantSlug?: string;
}

export class LoginResponseDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  refreshToken!: string;

  @ApiProperty({ example: 3600 })
  expiresIn!: number;

  @ApiProperty()
  user!: {
    id: string;
    email: string;
    fullName: string | null;
    tenantId: string;
    roles: string[];
    permissions: string[];
    mustChangePassword: boolean;
  };
}
