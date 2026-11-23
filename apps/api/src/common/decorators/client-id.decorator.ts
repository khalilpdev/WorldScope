import {
  BadRequestException,
  createParamDecorator,
  type ExecutionContext,
} from '@nestjs/common';

export const CLIENT_ID_HEADER = 'x-client-id';
const CLIENT_ID_PATTERN = /^[A-Za-z0-9_-]{8,64}$/;

interface RequestWithHeaders {
  headers: Record<string, string | string[] | undefined>;
}

/**
 * Reads the anonymous browser identifier used to scope favourites and saved
 * comparisons. This is not authentication: it only separates records between
 * browsers and must not be treated as an access-control mechanism.
 */
export const ClientId = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string => {
    const request = context.switchToHttp().getRequest<RequestWithHeaders>();
    const raw = request.headers[CLIENT_ID_HEADER];
    const value = Array.isArray(raw) ? raw[0] : raw;

    if (!value || !CLIENT_ID_PATTERN.test(value)) {
      throw new BadRequestException(
        `Missing or invalid ${CLIENT_ID_HEADER} header. Expected 8-64 characters using letters, digits, "-" or "_".`,
      );
    }
    return value;
  },
);
