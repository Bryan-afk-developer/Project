import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Flower {
    id: number;
    name: string;
    scientific_name?: string;
    description: string;
    price: number;
    image: string;
    category_id: number;
    category_name?: string;
    user_id: number;
    seller_name?: string;
    published: boolean;
    stock: number;
    care_instructions?: string;
    meaning?: string;
    views: number;
    created_at: string;
    updated_at: string;
    colors?: string[];
    seasons?: any[];
    additional_images?: string[];
    favorite_count?: number;
}

export interface FlowerFilters {
    category?: number;
    season?: number;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
    page?: number;
    limit?: number;
    sort?: string;
    order?: string;
}

@Injectable({
    providedIn: 'root'
})
export class FlowersService {
    private apiUrl = 'https://project-t84o.onrender.com/api/flowers';

    constructor(private http: HttpClient) { }

    /**
     * Get all flowers with optional filters
     */
    getFlowers(filters: FlowerFilters = {}): Observable<{
        success: boolean;
        data: Flower[];
        pagination?: any;
    }> {
        let params = new HttpParams();

        if (filters.category) params = params.set('category', filters.category.toString());
        if (filters.season) params = params.set('season', filters.season.toString());
        if (filters.minPrice) params = params.set('minPrice', filters.minPrice.toString());
        if (filters.maxPrice) params = params.set('maxPrice', filters.maxPrice.toString());
        if (filters.search) params = params.set('search', filters.search);
        if (filters.page) params = params.set('page', filters.page.toString());
        if (filters.limit) params = params.set('limit', filters.limit.toString());
        if (filters.sort) params = params.set('sort', filters.sort);
        if (filters.order) params = params.set('order', filters.order);

        return this.http.get<{
            success: boolean;
            data: Flower[];
            pagination?: any;
        }>(this.apiUrl, { params });
    }

    /**
     * Get single flower by ID
     */
    getFlowerById(id: number): Observable<{ success: boolean; data: Flower }> {
        return this.http.get<{ success: boolean; data: Flower }>(`${this.apiUrl}/${id}`);
    }

    /**
     * Create new flower
     */
    createFlower(flowerData: Partial<Flower>): Observable<any> {
        return this.http.post(this.apiUrl, flowerData);
    }

    /**
     * Update flower
     */
    updateFlower(id: number, flowerData: Partial<Flower>): Observable<any> {
        return this.http.put(`${this.apiUrl}/${id}`, flowerData);
    }

    /**
     * Delete flower
     */
    deleteFlower(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`);
    }

    /**
     * Get flowers by user ID
     */
    getFlowersByUser(userId: number): Observable<{ success: boolean; data: Flower[] }> {
        return this.http.get<{ success: boolean; data: Flower[] }>(`${this.apiUrl}/user/${userId}`);
    }
}
