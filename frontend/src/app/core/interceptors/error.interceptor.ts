import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Error Interceptor - Handles HTTP errors globally
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    const router = inject(Router);
    const authService = inject(AuthService);

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            let errorMessage = 'An error occurred';

            if (error.error instanceof ErrorEvent) {
                // Client-side error
                errorMessage = `Error: ${error.error.message}`;
            } else {
                // Server-side error
                switch (error.status) {
                    case 401:
                        // Unauthorized - invalid/expired token
                        errorMessage = 'Your session has expired. Please login again.';
                        authService.logout();
                        router.navigate(['/login']);
                        break;
                    case 403:
                        // Forbidden
                        errorMessage = 'You do not have permission to perform this action.';
                        break;
                    case 404:
                        errorMessage = error.error?.message || 'Resource not found.';
                        break;
                    case 409:
                        errorMessage = error.error?.message || 'Conflict occurred.';
                        break;
                    case 500:
                        errorMessage = 'Server error. Please try again later.';
                        break;
                    default:
                        errorMessage = error.error?.message || `Error Code: ${error.status}`;
                }
            }

            console.error('HTTP Error:', errorMessage, error);

            // You can show a toast/notification here
            // this.toastService.error(errorMessage);

            return throwError(() => ({
                message: errorMessage,
                status: error.status,
                error: error.error
            }));
        })
    );
};
