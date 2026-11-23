import {
  CLIENT_ID_STORAGE_KEY,
  type ApiErrorBody,
  type CompareResponse,
  type CountryDetailResponse,
  type CountryIndicatorsResponse,
  type FavoriteCountryRecord,
  type FavoritesResponse,
  type OverviewResponse,
  type PaginatedCountries,
  type SavedComparisonRecord,
  type SavedComparisonsResponse,
  type WeatherResponse,
} from '@worldscope/shared';

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api/v1';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly details?: string[],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Anonymous browser identifier. Not authentication; see the API documentation. */
export function getClientId(): string {
  let id = localStorage.getItem(CLIENT_ID_STORAGE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(CLIENT_ID_STORAGE_KEY, id);
  }
  return id;
}

type QueryValue = string | number | boolean | undefined | null;

function buildUrl(path: string, params?: Record<string, QueryValue>): string {
  const url = new URL(`${API_BASE}${path}`, window.location.origin);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === '') continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.pathname + url.search;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'DELETE';
  body?: unknown;
  /** Send the anonymous client id header (favourites and saved comparisons). */
  clientScoped?: boolean;
  signal?: AbortSignal;
}

async function request<T>(path: string, params?: Record<string, QueryValue>, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (options.clientScoped) headers['x-client-id'] = getClientId();

  let response: Response;
  try {
    response = await fetch(buildUrl(path, params), {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ApiError(0, 'The API could not be reached. Check that it is running on port 3000.');
  }

  if (response.status === 204) return undefined as T;

  const raw = await response.text();
  const payload: unknown = raw ? safeJson(raw) : null;

  if (!response.ok) {
    const body = payload as ApiErrorBody | null;
    const message =
      typeof body?.message === 'string'
        ? body.message
        : Array.isArray(body?.message)
          ? body.message.join('; ')
          : response.statusText || 'Request failed';
    throw new ApiError(
      response.status,
      message,
      Array.isArray(body?.message) ? body.message : undefined,
    );
  }

  return payload as T;
}

function safeJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export interface CountryListParams {
  page?: number;
  limit?: number;
  search?: string;
  region?: string;
  subregion?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export const api = {
  getOverview: (signal?: AbortSignal): Promise<OverviewResponse> =>
    request('/overview', undefined, { signal }),

  listCountries: (params: CountryListParams, signal?: AbortSignal): Promise<PaginatedCountries> =>
    request('/countries', { ...params }, { signal }),

  getCountry: (code: string, signal?: AbortSignal): Promise<CountryDetailResponse> =>
    request(`/countries/${encodeURIComponent(code)}`, undefined, { signal }),

  getIndicators: (code: string, years: number, signal?: AbortSignal): Promise<CountryIndicatorsResponse> =>
    request(`/countries/${encodeURIComponent(code)}/indicators`, { years }, { signal }),

  getWeather: (code: string, signal?: AbortSignal): Promise<WeatherResponse> =>
    request(`/countries/${encodeURIComponent(code)}/weather`, undefined, { signal }),

  compare: (codes: string[], signal?: AbortSignal): Promise<CompareResponse> =>
    request('/compare', { codes: codes.join(',') }, { signal }),

  listFavorites: (signal?: AbortSignal): Promise<FavoritesResponse> =>
    request('/favorites', undefined, { clientScoped: true, signal }),

  addFavorite: (countryCode: string): Promise<FavoriteCountryRecord> =>
    request('/favorites', undefined, {
      method: 'POST',
      clientScoped: true,
      body: { countryCode },
    }),

  removeFavorite: (countryCode: string): Promise<void> =>
    request(`/favorites/${encodeURIComponent(countryCode)}`, undefined, {
      method: 'DELETE',
      clientScoped: true,
    }),

  listComparisons: (signal?: AbortSignal): Promise<SavedComparisonsResponse> =>
    request('/comparisons', undefined, { clientScoped: true, signal }),

  saveComparison: (countryCodes: string[], name?: string): Promise<SavedComparisonRecord> =>
    request('/comparisons', undefined, {
      method: 'POST',
      clientScoped: true,
      body: { countryCodes, ...(name?.trim() ? { name: name.trim() } : {}) },
    }),

  deleteComparison: (id: string): Promise<void> =>
    request(`/comparisons/${encodeURIComponent(id)}`, undefined, {
      method: 'DELETE',
      clientScoped: true,
    }),
};

/** Extracts a readable message from any thrown value. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Unexpected error';
}
