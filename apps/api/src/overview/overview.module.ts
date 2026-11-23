import { Module } from '@nestjs/common';
import { ProvidersModule } from '../providers/providers.module';
import { OverviewController } from './overview.controller';
import { OverviewService } from './overview.service';

@Module({
  imports: [ProvidersModule],
  controllers: [OverviewController],
  providers: [OverviewService],
})
export class OverviewModule {}
