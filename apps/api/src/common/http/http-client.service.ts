import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProviderError, type ProviderId } from '../errors/provider.error';

export interface GetJsonOptions {
  provider: ProviderId;
  /** Extra attempts after the first failure. Defaults to 1 (two attempts total). */
  retries?: number;
  timeoutMs?: number;
  accept?: string;
}

const RETRY_BASE_DELAY_MS = 250;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Single entry point for every outbound request: applies timeouts, bounded
 * retries for transient failures and uniform error reporting. Providers never
 * call `fetch` directly.
 */
@Injectable()
export class HttpClientService {
  private readonly logger = new Logger(HttpClientService.name);
  private readonly defaultTimeoutMs: number;

  constructor(config: ConfigService) {
    this.defaultTimeoutMs = config.getOrThrow<number>('http.timeoutMs');
  }

  async getJson<T>(url: string, options: GetJsonOptions): Promise<T> {
    const attempts = (options.retries ?? 1) + 1;
    const timeoutMs = options.timeoutMs ?? this.defaultTimeoutMs;
    let lastError: ProviderError | null = null;

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        const response = await fetch(url, {
          headers: {
            accept: options.accept ?? 'application/json',
            'user-agent': 'WorldScope/1.0 (open-source portfolio project)',
          },
          signal: AbortSignal.timeout(timeoutMs),
        });

        if (!response.ok) {
          const retryable = response.status >= 500 || response.status === 429;
          const error = new ProviderError(
            `${options.provider} responded with HTTP ${response.status}`,
            { provider: options.provider, status: response.status, retryable },
          );
          if (retryable && attempt < attempts) {
            lastError = error;
            await delay(RETRY_BASE_DELAY_MS * attempt);
            continue;
          }
          throw error;
        }

        const body = await response.text();
        try {
          return JSON.parse(body) as T;
        } catch (cause) {
          throw new ProviderError(`${options.provider} returned malformed JSON`, {
            provider: options.provider,
            status: response.status,
            cause,
          });
        }
      } catch (error) {
        if (error instanceof ProviderError) {
          lastError = error;
          if (error.retryable && attempt < attempts) {
            await delay(RETRY_BASE_DELAY_MS * attempt);
            continue;
          }
          throw error;
        }

        const isTimeout = error instanceof Error && error.name === 'TimeoutError';
        lastError = new ProviderError(
          isTimeout
            ? `${options.provider} timed out after ${timeoutMs}ms`
            : `${options.provider} request failed`,
          { provider: options.provider, cause: error, retryable: true },
        );
        if (attempt < attempts) {
          await delay(RETRY_BASE_DELAY_MS * attempt);
          continue;
        }
      }
    }

    this.logger.warn(`All ${attempts} attempts failed for ${options.provider}`);
    throw lastError ?? new ProviderError(`${options.provider} request failed`, {
      provider: options.provider,
    });
  }
}
