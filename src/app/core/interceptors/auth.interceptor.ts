import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Auth } from '../../services/auth';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(Auth);

  const isBackend =
    req.url.startsWith('/api') ||
    req.url.startsWith('/sanctum');

  const request = isBackend
    ? req.clone({
        withCredentials: true,
        setHeaders: {
          Accept: 'application/json'
        }
      })
    : req;

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        auth.clearAuth();
      }

      return throwError(() => error);
    })
  );
};
