import { buildSuccess } from '#config/api.response';
import { censorObject } from '#config/censor.config';
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T> {
  private readonly excludedPaths = ['/health', '/metrics', '/docs', '/openapi.json', '/openapi.yaml', '/v1/health', '/v1/metrics', '/v1/docs'];

  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    
    // Check if the current path is in the exclusion list
    if (this.excludedPaths.some(path => req.url === path || req.url.startsWith(path + '?'))) {
      return next.handle();
    }
    
    const res = context.switchToHttp().getResponse<{ statusCode: number }>();

    return next.handle().pipe(
      map((data) => {
        // Allow controllers to bypass the wrapper by returning a pre-built
        // ApiResponse (detected by the `success` boolean flag).
        if (data && typeof data === 'object' && 'success' in (data as object)) {
          (res as any).locals = (res as any).locals || {};
          (res as any).locals.body = data;
          return data;
        }

        const statusCode = res.statusCode ?? 200;

        const censored =
          data !== null && data !== undefined && typeof data === 'object'
            ? censorObject(data as Record<string, unknown>)
            : data;

        const result = buildSuccess(censored, 'OK', statusCode, {
          path: req.url,
          requestId: req.headers['x-request-id'] as string | undefined,
        });

        // Store for pino-http logging
        (res as any).locals = (res as any).locals || {};
        (res as any).locals.body = result;

        return result;
      }),
    );
  }
}
