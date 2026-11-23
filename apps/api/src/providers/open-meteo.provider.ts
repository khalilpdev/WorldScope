import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Coordinates, DailyForecast, DataSourceInfo } from '@worldscope/shared';
import { CacheService } from '../cache/cache.service';
import { HttpClientService } from '../common/http/http-client.service';
import { ProviderError } from '../common/errors/provider.error';

interface OpenMeteoResponse {
  timezone?: string;
  current?: {
    time?: string;
    temperature_2m?: number | null;
    apparent_temperature?: number | null;
    relative_humidity_2m?: number | null;
    precipitation?: number | null;
    wind_speed_10m?: number | null;
    weather_code?: number | null;
  };
  daily?: {
    time?: string[];
    temperature_2m_max?: Array<number | null>;
    temperature_2m_min?: Array<number | null>;
    precipitation_sum?: Array<number | null>;
    weather_code?: Array<number | null>;
  };
}

export interface WeatherSnapshot {
  coordinates: Coordinates;
  timezone: string | null;
  current: {
    time: string;
    temperatureC: number | null;
    apparentTemperatureC: number | null;
    humidityPercent: number | null;
    precipitationMm: number | null;
    windSpeedKmh: number | null;
    weatherCode: number | null;
    description: string;
  } | null;
  daily: DailyForecast[];
  retrievedAt: string;
}

/** WMO 4677 weather codes used by Open-Meteo. */
const WEATHER_DESCRIPTIONS: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  56: 'Light freezing drizzle',
  57: 'Dense freezing drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  66: 'Light freezing rain',
  67: 'Heavy freezing rain',
  71: 'Slight snowfall',
  73: 'Moderate snowfall',
  75: 'Heavy snowfall',
  77: 'Snow grains',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  85: 'Slight snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with slight hail',
  99: 'Thunderstorm with heavy hail',
};

export function describeWeatherCode(code: number | null | undefined): string {
  if (code === null || code === undefined) return 'Conditions unavailable';
  return WEATHER_DESCRIPTIONS[code] ?? `Unknown conditions (code ${code})`;
}

@Injectable()
export class OpenMeteoProvider {
  private readonly baseUrl: string;
  private readonly ttlSeconds: number;

  constructor(
    private readonly http: HttpClientService,
    private readonly cache: CacheService,
    config: ConfigService,
  ) {
    this.baseUrl = config.getOrThrow<string>('providers.openMeteoBaseUrl');
    this.ttlSeconds = config.getOrThrow<number>('cache.weatherTtlSeconds');
  }

  sourceInfo(retrievedAt: string): DataSourceInfo {
    return {
      id: 'open-meteo',
      name: 'Open-Meteo',
      url: 'https://open-meteo.com/',
      retrievedAt,
      license: 'CC BY 4.0',
      note: 'Forecast for the capital city coordinates. Refreshed every 30 minutes.',
    };
  }

  async getForecast(
    coordinates: Coordinates,
  ): Promise<{ data: WeatherSnapshot; cached: boolean }> {
    const lat = Number(coordinates.lat.toFixed(3));
    const lng = Number(coordinates.lng.toFixed(3));
    const cacheKey = `worldscope:weather:v2:${lat}:${lng}`;

    const { value, cached } = await this.cache.wrap<WeatherSnapshot>(
      cacheKey,
      this.ttlSeconds,
      async () => this.fetchForecast({ lat, lng }),
    );
    return { data: value, cached };
  }

  private async fetchForecast(coordinates: Coordinates): Promise<WeatherSnapshot> {
    const params = new URLSearchParams({
      latitude: String(coordinates.lat),
      longitude: String(coordinates.lng),
      current:
        'temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,wind_speed_10m,weather_code',
      daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code',
      timezone: 'auto',
      forecast_days: '7',
    });

    const url = `${this.baseUrl.replace(/\/$/, '')}/forecast?${params.toString()}`;
    const payload = await this.http.getJson<OpenMeteoResponse>(url, {
      provider: 'open-meteo',
    });

    if (!payload.current && !payload.daily) {
      throw new ProviderError('open-meteo returned an empty forecast', {
        provider: 'open-meteo',
      });
    }

    return {
      coordinates,
      timezone: payload.timezone ?? null,
      current: payload.current?.time
        ? {
            time: payload.current.time,
            temperatureC: payload.current.temperature_2m ?? null,
            apparentTemperatureC: payload.current.apparent_temperature ?? null,
            humidityPercent: payload.current.relative_humidity_2m ?? null,
            precipitationMm: payload.current.precipitation ?? null,
            windSpeedKmh: payload.current.wind_speed_10m ?? null,
            weatherCode: payload.current.weather_code ?? null,
            description: describeWeatherCode(payload.current.weather_code),
          }
        : null,
      daily: this.mapDaily(payload.daily),
      retrievedAt: new Date().toISOString(),
    };
  }

  private mapDaily(daily: OpenMeteoResponse['daily']): DailyForecast[] {
    const dates = daily?.time;
    if (!Array.isArray(dates)) return [];

    return dates.map((date, index) => ({
      date,
      temperatureMaxC: daily?.temperature_2m_max?.[index] ?? null,
      temperatureMinC: daily?.temperature_2m_min?.[index] ?? null,
      precipitationMm: daily?.precipitation_sum?.[index] ?? null,
      weatherCode: daily?.weather_code?.[index] ?? null,
      description: describeWeatherCode(daily?.weather_code?.[index]),
    }));
  }
}
