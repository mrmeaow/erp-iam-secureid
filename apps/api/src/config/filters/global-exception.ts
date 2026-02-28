import { buildError } from '#config/api.response';
import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
    Injectable,
    Logger
} from '@nestjs/common';
import { Request, Response } from 'express';

interface NestValidationError {
  message?: string | string[];
  error?: string;
  statusCode?: number;
}

@Injectable()
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {

  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_ERROR';
    let details: unknown = undefined;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const raw = exception.getResponse() as NestValidationError | string;

      if (typeof raw === 'string') {
        message = raw;
      } else {
        message = Array.isArray(raw.message)
          ? raw.message.join('; ')
          : (raw.message ?? exception.message);

        if (statusCode === HttpStatus.UNPROCESSABLE_ENTITY || statusCode === HttpStatus.BAD_REQUEST) {
          details = raw;
        }
      }

      code = this.statusToCode(statusCode);
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(
        `Unhandled exception: ${exception.message}`,
        exception.stack,
        'GlobalExceptionFilter',
      );
    }

    const meta = {
      path: request.url,
      requestId: request.headers['x-request-id'] as string | undefined,
    };

    const result = buildError(message, statusCode, code, details, meta);
    
    // Store for pino-http logging
    (response as any).locals = (response as any).locals || {};
    (response as any).locals.body = result;

    response.status(statusCode).json(result);
  }

  private statusToCode(status: number): string {
    const map: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'VALIDATION_ERROR',
      429: 'RATE_LIMITED',
      500: 'INTERNAL_ERROR',
      502: 'BAD_GATEWAY',
      503: 'SERVICE_UNAVAILABLE',
    };
    return map[status] ?? 'HTTP_ERROR';
  }
}
