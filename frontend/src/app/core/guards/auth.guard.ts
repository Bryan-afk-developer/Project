import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Auth Guard - Protects routes that require authentication
 */
export const authGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isAuthenticated()) {
        return true;
    }

    // Store the attempted URL for redirecting
    authService.redirectUrl = state.url;

    // Navigate to login page
    router.navigate(['/login']);
    return false;
};

/**
 * Guest Guard - Prevents authenticated users from accessing login/register pages
 */
export const guestGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isAuthenticated()) {
        return true;
    }

    // Already logged in, redirect to home
    router.navigate(['/']);
    return false;
};
