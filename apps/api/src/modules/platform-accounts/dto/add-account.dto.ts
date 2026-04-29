import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { PlatformName } from '@prisma/client';

export class AddAccountDto {
  @ApiProperty({ enum: PlatformName, example: PlatformName.YOUTUBE })
  @IsEnum(PlatformName)
  platform!: PlatformName;

  @ApiProperty({
    example: 'MyMasterPassword123!',
    description:
      'Master Password — Phase 1 gửi qua TLS tới API; Phase 3 sẽ derive client-side và chỉ gửi UDK đã wrap',
    minLength: 6,
  })
  @IsString()
  @MinLength(6, { message: 'Master password phải ít nhất 6 ký tự (Phase 1 dev). Phase 3 ≥ 12.' })
  masterPassword!: string;

  @ApiPropertyOptional({
    example: 'Kênh Bếp Bà Liêu',
    description: 'Nhãn người dùng tự đặt cho dễ quản lý',
  })
  @IsOptional()
  @IsString()
  accountLabel?: string;
}

export class PlatformAccountSummaryDto {
  id!: string;
  platform!: PlatformName;
  accountLabel!: string;
  status!: string;
  channelName?: string;
  channelUrl?: string;
  channelThumbnailUrl?: string | null;
  lastVerifiedAt!: Date | null;
  createdAt!: Date;
}
