import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ToastService } from '../services/toast.service'; // Toast service for notifications

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private router: Router, private toastService: ToastService) {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = 'An unknown error occurred!';
        let displayMessage = 'Something went wrong. Please try again later.';

        if (error.error instanceof ErrorEvent) {
          // Client-side error
          errorMessage = `Error: ${error.error.message}`;
          displayMessage = 'A client-side error occurred.';
        } else {
          // Server-side error
          errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;

          switch (error.status) {
            case 400:
              // Bad Request (e.g., validation errors)
              if (error.error && error.error.message) {
                if (Array.isArray(error.error.message)) {
                  displayMessage = error.error.message.join(', ');
                } else if (typeof error.error.message === 'string') {
                  displayMessage = error.error.message;
                }
              } else if (error.error && typeof error.error === 'string') {
                displayMessage = error.error;
              } else {
                displayMessage = 'Bad Request.';
              }
              break;

            case 401:
              displayMessage = 'Unauthorized. Please log in again.';
              if (this.router.url !== '/auth/login') {
                this.router.navigate(['/auth/login']);
              }
              break;

            case 403:
              displayMessage =
                'Forbidden. You do not have permission to access this resource.';
              this.router.navigate(['/dashboard']); // Or a dedicated "Access Denied" page
              break;

            case 404:
              displayMessage = 'Resource not found.';
              break;

            case 500:
              displayMessage = 'Internal Server Error. Please try again later.';
              break;

            default:
              displayMessage = 'An unexpected error occurred.';
              break;
          }
        }

        // Log technical error for developers
        console.error(errorMessage);

        // Display user-friendly toast notification
        this.toastService.error(displayMessage);

        // Re-throw the error to let other interceptors or components handle it
        return throwError(() => error);
      })
    );
  }
}
