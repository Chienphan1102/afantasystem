import { Global, Module } from '@nestjs/common';
import { ScrapeJobsService } from './scrape-jobs.service';

@Global()
@Module({
  providers: [ScrapeJobsService],
  exports: [ScrapeJobsService],
})
export class ScrapeJobsModule {}
