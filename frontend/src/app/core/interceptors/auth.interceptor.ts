import {
  HttpInterceptorFn,
  HttpRequest,
  HttpEvent,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from '../../auth/services/auth.service';

export const AuthInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  console.log('[AuthInterceptor] Intercepting request:', req.url);
  const token = authService.getToken;

  if (token) {
    req = addTokenToRequest(req, token);
  }

  return next(req).pipe(
    catchError((error) => {
      if (error.status === 401 && token) {
        // Token expired, try to refresh
        console.warn(
          '[AuthInterceptor] 401 Unauthorized. Attempting token refresh.'
        );
        return authService.refreshToken().pipe(
          switchMap((authResponse) => {
            console.log(
              '[AuthInterceptor] Token refreshed. Retrying request:',
              req.url
            );
            const newReq = addTokenToRequest(req, authResponse.token);
            return next(newReq);
          }),
          catchError((refreshError) => {
            // Refresh failed, logout user
            console.error(
              '[AuthInterceptor] Token refresh failed. Logging out user.'
            );
            authService.logout();
            return throwError(refreshError);
          })
        );
      }
      return throwError(error);
    })
  );
};

function addTokenToRequest(
  req: HttpRequest<any>,
  token: string
): HttpRequest<any> {
  console.log('[AuthInterceptor] Attaching token to request:', req.url);
  return req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });
}
