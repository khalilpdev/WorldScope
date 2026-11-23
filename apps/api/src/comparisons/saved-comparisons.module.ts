import { Module } from '@nestjs/common';
import { ProvidersModule } from '../providers/providers.module';
import { SavedComparisonsController } from './saved-comparisons.controller';
import { SavedComparisonsService } from './saved-comparisons.service';

@Module({
  imports: [ProvidersModule],
  controllers: [SavedComparisonsController],
  providers: [SavedComparisonsService],
})
export class SavedComparisonsModule {}
