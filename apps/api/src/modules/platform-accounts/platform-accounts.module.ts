import { Module } from '@nestjs/common';
import { PlatformAccountsController } from './platform-accounts.controller';
import { PlatformAccountsService } from './platform-accounts.service';
import { EmbeddedBrowserService } from './embedded-browser/embedded-browser.service';

@Module({
  controllers: [PlatformAccountsController],
  providers: [PlatformAccountsService, EmbeddedBrowserService],
})
export class PlatformAccountsModule {}
