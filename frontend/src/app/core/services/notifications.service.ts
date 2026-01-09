import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Notification {
    id: number;
    type: string;
    title: string;
    message: string;
    link?: string;
    read: boolean;
    created_at: string;
}

@Injectable({
    providedIn: 'root'
})
export class NotificationsService {
    private apiUrl = 'https://project-t84o.onrender.com/api/notifications';

    constructor(private http: HttpClient) { }

    /**
     * Get all notifications for current user
     */
    getNotifications(limit = 20, offset = 0): Observable<{ success: boolean; data: Notification[] }> {
        return this.http.get<{ success: boolean; data: Notification[] }>(
            `${this.apiUrl}?limit=${limit}&offset=${offset}`
        );
    }

    /**
     * Get unread notification count
     */
    getUnreadCount(): Observable<{ success: boolean; data: { unread_count: number } }> {
        return this.http.get<{ success: boolean; data: { unread_count: number } }>(
            `${this.apiUrl}/unread-count`
        );
    }

    /**
     * Mark notification as read
     */
    markAsRead(id: number): Observable<any> {
        return this.http.patch(`${this.apiUrl}/${id}/read`, {});
    }

    /**
     * Mark all notifications as read
     */
    markAllAsRead(): Observable<any> {
        return this.http.patch(`${this.apiUrl}/read-all`, {});
    }
}
