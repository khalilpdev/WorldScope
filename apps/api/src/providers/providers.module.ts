import { HttpModule } from '../common/http/http.module';
import { Module } from '@nestjs/common';
import { CountryCatalogProvider } from './country-catalog.provider';
import { OpenMeteoProvider } from './open-meteo.provider';
import { WorldBankProvider } from './world-bank.provider';

@Module({
  imports: [HttpModule],
  providers: [CountryCatalogProvider, WorldBankProvider, OpenMeteoProvider],
  exports: [CountryCatalogProvider, WorldBankProvider, OpenMeteoProvider],
})
export class ProvidersModule {}
