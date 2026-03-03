import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { ApiConfiguration } from '../api/api-configuration';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const apiConfig = inject(ApiConfiguration);
  const token = authService.getAccessToken();
  const rootUrl = (apiConfig.rootUrl || '').replace(/\/$/, '');
  const isApiCall = rootUrl ? req.url.startsWith(rootUrl) : req.url.startsWith('/v1/');

  let authReq = req;
  // Attach JWT if available and request is to our API
  if (token && isApiCall) {
    authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`),
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Check for 401 Unauthorized, but only if it's not the refresh or login calls
      const isAuthCall = req.url.includes('/auth/login') || req.url.includes('/auth/refresh');

      if (error.status === 401 && !isAuthCall) {
        // Attempt to refresh the token
        return from(authService.refresh()).pipe(
          switchMap(() => {
            const newToken = authService.getAccessToken();
            const retriedReq = req.clone({
              headers: req.headers.set('Authorization', `Bearer ${newToken}`),
            });
            return next(retriedReq);
          }),
          catchError((refreshError) => {
            // Refresh failed, logout
            authService.logout();
            return throwError(() => refreshError);
          }),
        );
      }
      return throwError(() => error);
    }),
  );
};
