import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface CartItem {
    id: number;
    quantity: number;
    added_at: string;
    flower_id: number;
    name: string;
    price: number;
    image: string;
    stock: number;
    published: boolean;
    subtotal: number;
}

export interface Cart {
    cart_id: number;
    items: CartItem[];
    item_count: number;
    total_quantity: number;
    total: string;
}

@Injectable({
    providedIn: 'root'
})
export class CartService {
    private apiUrl = 'https://project-t84o.onrender.com/api/cart';
    private cartSubject = new BehaviorSubject<Cart | null>(null);
    public cart$ = this.cartSubject.asObservable();

    constructor(private http: HttpClient) { }

    getCart(): Observable<{ success: boolean; data: Cart }> {
        return this.http.get<{ success: boolean; data: Cart }>(this.apiUrl).pipe(
            tap(response => {
                if (response.success) {
                    this.cartSubject.next(response.data);
                }
            })
        );
    }

    addItem(flower_id: number, quantity: number = 1): Observable<any> {
        return this.http.post(`${this.apiUrl}/items`, { flower_id, quantity }).pipe(
            tap(() => this.refreshCart())
        );
    }

    updateItem(itemId: number, quantity: number): Observable<any> {
        return this.http.put(`${this.apiUrl}/items/${itemId}`, { quantity }).pipe(
            tap(() => this.refreshCart())
        );
    }

    removeItem(itemId: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/items/${itemId}`).pipe(
            tap(() => this.refreshCart())
        );
    }

    clearCart(): Observable<any> {
        return this.http.delete(this.apiUrl).pipe(
            tap(() => this.refreshCart())
        );
    }

    checkout(delivery_address: string, notes?: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/checkout`, { delivery_address, notes }).pipe(
            tap(() => this.cartSubject.next(null))
        );
    }

    private refreshCart(): void {
        this.getCart().subscribe();
    }
}
