import { Module } from '@nestjs/common';
import { ProvidersModule } from '../providers/providers.module';
import { CompareController } from './compare.controller';
import { CompareService } from './compare.service';

@Module({
  imports: [ProvidersModule],
  controllers: [CompareController],
  providers: [CompareService],
})
export class CompareModule {}
