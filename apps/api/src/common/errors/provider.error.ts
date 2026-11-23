export type ProviderId = 'country-catalog' | 'world-bank' | 'open-meteo';

export interface ProviderErrorOptions {
  provider: ProviderId;
  status?: number;
  cause?: unknown;
  retryable?: boolean;
}

/**
 * Normalised failure raised by outbound provider clients. Controllers translate
 * it into a 502 so callers can distinguish "our bug" from "upstream is down".
 */
export class ProviderError extends Error {
  readonly provider: ProviderId;
  readonly status: number | null;
  readonly retryable: boolean;

  constructor(message: string, options: ProviderErrorOptions) {
    super(message, { cause: options.cause });
    this.name = 'ProviderError';
    this.provider = options.provider;
    this.status = options.status ?? null;
    this.retryable = options.retryable ?? false;
  }
}
