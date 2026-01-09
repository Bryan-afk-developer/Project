import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ProfileService {
    private apiUrl = 'https://project-t84o.onrender.com/api/profile';

    constructor(private http: HttpClient) { }

    /**
     * Get user profile
     */
    getProfile(): Observable<any> {
        return this.http.get(this.apiUrl);
    }

    /**
     * Update user profile
     */
    updateProfile(profileData: {
        first_name?: string;
        last_name?: string;
        phone?: string;
        avatar?: string;
        bio?: string;
    }): Observable<any> {
        return this.http.patch(this.apiUrl, profileData);
    }

    /**
     * Get user's published flowers
     */
    getUserPublications(): Observable<any> {
        return this.http.get(`${this.apiUrl}/publications`);
    }

    /**
     * Get user statistics
     */
    getUserStats(): Observable<any> {
        return this.http.get(`${this.apiUrl}/stats`);
    }
}
