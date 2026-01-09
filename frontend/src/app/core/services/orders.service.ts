import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Order {
    id: number;
    order_number: string;
    flower_id: number;
    quantity: number;
    unit_price: number;
    total_price: number;
    status: string;
    delivery_address: string;
    color_preference?: string;
    notes?: string;
    created_at: string;
    flower_name?: string;
    flower_image?: string;
    seller_name?: string;
    status_history?: any[];
}

@Injectable({
    providedIn: 'root'
})
export class OrdersService {
    private apiUrl = 'https://project-t84o.onrender.com/api/orders';

    constructor(private http: HttpClient) { }

    /**
     * Create new order
     */
    createOrder(orderData: {
        flower_id: number;
        quantity: number;
        delivery_address: string;
        color_preference?: string;
        notes?: string;
    }): Observable<any> {
        return this.http.post(this.apiUrl, orderData);
    }

    /**
     * Get all orders for current user
     */
    getUserOrders(): Observable<{ success: boolean; data: Order[] }> {
        return this.http.get<{ success: boolean; data: Order[] }>(this.apiUrl);
    }

    /**
     * Get single order by ID
     */
    getOrderById(id: number): Observable<{ success: boolean; data: Order }> {
        return this.http.get<{ success: boolean; data: Order }>(`${this.apiUrl}/${id}`);
    }

    /**
     * Update order status (florist/admin only)
     */
    updateOrderStatus(id: number, status: string, notes?: string): Observable<any> {
        return this.http.patch(`${this.apiUrl}/${id}/status`, { status, notes });
    }
}
