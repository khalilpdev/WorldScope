import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
  Logger,
  type ExceptionFilter,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';
import type { ApiErrorBody } from '@worldscope/shared';
import { ProviderError } from '../errors/provider.error';

interface HttpErrorPayload {
  message?: string | string[];
  error?: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly isProduction: boolean) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    let statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let error = 'Internal Server Error';
    let message: string | string[] = 'Unexpected error';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const payload = exception.getResponse();
      if (typeof payload === 'string') {
        message = payload;
        error = exception.name;
      } else {
        const parsed = payload as HttpErrorPayload;
        message = parsed.message ?? exception.message;
        error = parsed.error ?? exception.name;
      }
    } else if (exception instanceof ProviderError) {
      statusCode = HttpStatus.BAD_GATEWAY;
      error = 'Bad Gateway';
      message = `Upstream data provider "${exception.provider}" is unavailable. Please try again later.`;
      this.logger.warn(`${exception.provider}: ${exception.message}`);
    } else if (
      exception instanceof Prisma.PrismaClientInitializationError ||
      exception instanceof Prisma.PrismaClientUnknownRequestError
    ) {
      statusCode = HttpStatus.SERVICE_UNAVAILABLE;
      error = 'Service Unavailable';
      message = 'The database is unavailable. Start PostgreSQL and apply migrations.';
      this.logger.error(`Database unavailable: ${exception.message}`);
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2025') {
        statusCode = HttpStatus.NOT_FOUND;
        error = 'Not Found';
        message = 'The requested record does not exist.';
      } else {
        statusCode = HttpStatus.SERVICE_UNAVAILABLE;
        error = 'Service Unavailable';
        message = 'The database could not complete the request.';
      }
      this.logger.error(`Prisma ${exception.code}: ${exception.message}`);
    } else {
      this.logger.error(
        `Unhandled exception on ${request.method} ${request.originalUrl}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
      if (!this.isProduction && exception instanceof Error) {
        message = exception.message;
      }
    }

    const body: ApiErrorBody = {
      statusCode,
      error,
      message,
      path: request.originalUrl,
      timestamp: new Date().toISOString(),
    };

    response.status(statusCode).json(body);
  }
}
