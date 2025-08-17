import { HttpHandlerFn, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthGuard } from '../guards/AuthGuardService';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
  const authGuard = inject(AuthGuard);
  const router = inject(Router);
  
  // Get the token from the storage
  const token = authGuard.getToken();
  
  // Clone the request and add the authorization header if the token exists
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        router.navigate(['/login']);
      } else if (error.status === 403) {
        console.error('Access denied:', error);
      }
      return throwError(() => error);
    })
  );
}
