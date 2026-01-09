import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

export interface User {
    id: number;
    email: string;
    first_name: string;
    last_name?: string;
    role: string;
    avatar?: string;
}

interface AuthResponse {
    success: boolean;
    data: {
        user: User;
        access_token: string;
        refresh_token: string;
    };
    message?: string;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private apiUrl = 'https://project-t84o.onrender.com/api/auth';
    private currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
    public currentUser$ = this.currentUserSubject.asObservable();

    redirectUrl: string | null = null;

    constructor(
        private http: HttpClient,
        private router: Router
    ) { }

    /**
     * Register new user
     */
    register(userData: any): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.apiUrl}/register`, userData).pipe(
            tap(response => {
                if (response.success) {
                    this.handleAuthSuccess(response.data);
                }
            })
        );
    }

    /**
     * Login user
     */
    login(email: string, password: string): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.apiUrl}/login`, { email, password }).pipe(
            tap(response => {
                if (response.success) {
                    this.handleAuthSuccess(response.data);
                }
            })
        );
    }

    /**
     * Logout user
     */
    logout(): void {
        const refreshToken = this.getRefreshToken();

        // Call logout endpoint
        if (refreshToken) {
            this.http.post(`${this.apiUrl}/logout`, { refresh_token: refreshToken }).subscribe();
        }

        // Clear local storage
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('current_user');

        this.currentUserSubject.next(null);
        this.router.navigate(['/login']);
    }

    /**
     * Get current user
     */
    getCurrentUser(): Observable<any> {
        return this.http.get(`${this.apiUrl}/me`);
    }

    /**
     * Refresh access token
     */
    refreshToken(): Observable<any> {
        const refreshToken = this.getRefreshToken();
        return this.http.post(`${this.apiUrl}/refresh`, { refresh_token: refreshToken }).pipe(
            tap((response: any) => {
                if (response.success) {
                    localStorage.setItem('access_token', response.data.access_token);
                }
            })
        );
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated(): boolean {
        const token = this.getToken();
        if (!token) return false;

        // Check if token is expired (basic check)
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const exp = payload.exp * 1000; // Convert to milliseconds
            return Date.now() < exp;
        } catch (e) {
            return false;
        }
    }

    /**
     * Get current user value
     */
    get currentUserValue(): User | null {
        return this.currentUserSubject.value;
    }

    /**
     * Get access token
     */
    getToken(): string | null {
        return localStorage.getItem('access_token');
    }

    /**
     * Get refresh token
     */
    getRefreshToken(): string | null {
        return localStorage.getItem('refresh_token');
    }

    /**
     * Handle successful authentication
     */
    private handleAuthSuccess(data: { user: User; access_token: string; refresh_token: string }): void {
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);
        localStorage.setItem('current_user', JSON.stringify(data.user));
        this.currentUserSubject.next(data.user);
    }

    /**
     * Get user from local storage
     */
    private getUserFromStorage(): User | null {
        const userStr = localStorage.getItem('current_user');
        return userStr ? JSON.parse(userStr) : null;
    }
}
