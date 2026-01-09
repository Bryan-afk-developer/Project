import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Review {
    id: number;
    rating: number;
    comment: string;
    helpful_count: number;
    created_at: string;
    updated_at: string;
    reviewer_name: string;
    reviewer_avatar?: string;
}

export interface Rating {
    review_count: number;
    average_rating: string;
    five_star: number;
    four_star: number;
    three_star: number;
    two_star: number;
    one_star: number;
}

@Injectable({
    providedIn: 'root'
})
export class ReviewsService {
    private apiUrl = 'http://localhost:3000/api';

    constructor(private http: HttpClient) { }

    getFlowerReviews(flowerId: number, page: number = 1, limit: number = 10, sort: string = 'recent'): Observable<any> {
        return this.http.get(`${this.apiUrl}/flowers/${flowerId}/reviews`, {
            params: { page: page.toString(), limit: limit.toString(), sort }
        });
    }

    getFlowerRating(flowerId: number): Observable<{ success: boolean; data: Rating }> {
        return this.http.get<{ success: boolean; data: Rating }>(`${this.apiUrl}/flowers/${flowerId}/rating`);
    }

    createReview(flowerId: number, rating: number, comment: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/flowers/${flowerId}/reviews`, { rating, comment });
    }

    updateReview(reviewId: number, rating: number, comment: string): Observable<any> {
        return this.http.put(`${this.apiUrl}/reviews/${reviewId}`, { rating, comment });
    }

    deleteReview(reviewId: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/reviews/${reviewId}`);
    }

    markHelpful(reviewId: number): Observable<any> {
        return this.http.post(`${this.apiUrl}/reviews/${reviewId}/helpful`, {});
    }
}
