import type { CountryDetail, CountrySummary, DataSourceInfo } from '@worldscope/shared';
import type { CatalogCountry } from '../providers/country-catalog.provider';
import type { PopulationValue, WorldBankCountryMeta } from '../providers/world-bank.provider';

export interface FlagUrls {
  png: string;
  svg: string;
}

export function computeDensity(
  population: number | null | undefined,
  areaKm2: number | null | undefined,
): number | null {
  if (!population || !areaKm2 || areaKm2 <= 0) return null;
  return Math.round((population / areaKm2) * 100) / 100;
}

export function toCountrySummary(
  country: CatalogCountry,
  population: PopulationValue | undefined,
  flagUrls: FlagUrls,
): CountrySummary {
  const populationValue = population?.value ?? null;
  return {
    code: country.code,
    alpha2: country.alpha2,
    name: country.name,
    officialName: country.officialName,
    capital: country.capital,
    region: country.region,
    subregion: country.subregion,
    nativeName: country.nativeName,
    population: populationValue,
    populationYear: population?.year ?? null,
    areaKm2: country.areaKm2,
    densityPerKm2: computeDensity(populationValue, country.areaKm2),
    flag: {
      emoji: country.flagEmoji,
      png: flagUrls.png,
      svg: flagUrls.svg,
    },
  };
}

export function toCountryDetail(
  country: CatalogCountry,
  population: PopulationValue | undefined,
  meta: WorldBankCountryMeta | undefined,
  flagUrls: FlagUrls,
  sources: DataSourceInfo[],
): CountryDetail {
  return {
    ...toCountrySummary(country, population, flagUrls),
    coordinates: country.coordinates,
    languages: country.languages,
    currencies: country.currencies,
    borders: country.borders,
    incomeLevel: meta?.incomeLevel ?? null,
    worldBankRegion: meta?.region ?? null,
    sources,
  };
}
