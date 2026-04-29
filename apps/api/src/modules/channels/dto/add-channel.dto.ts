import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class AddChannelDto {
  @ApiProperty({ description: 'ID PlatformAccount đã add ở Prompt 7' })
  @IsString()
  platformAccountId!: string;

  @ApiProperty({
    description: 'URL kênh YouTube (channel/UC..., @handle, c/customname, user/legacy)',
    example: 'https://www.youtube.com/@MrBeast',
  })
  @IsString()
  @MinLength(10)
  channelUrl!: string;

  @ApiPropertyOptional({ description: 'Master password để decrypt session khi scrape lần đầu' })
  @IsOptional()
  @IsString()
  masterPassword?: string;
}
