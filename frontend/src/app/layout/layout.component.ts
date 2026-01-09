import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav>
      <div class="nav">
        <h2 routerLink="/">🌸 Azzuna</h2>
        <div class="links">
          <a routerLink="/">Home</a>
          <a *ngIf="!auth.isAuthenticated()" routerLink="/login">Login</a>
          <a *ngIf="!auth.isAuthenticated()" routerLink="/register">Register</a>
          <button *ngIf="auth.isAuthenticated()" (click)="auth.logout()">Logout</button>
        </div>
      </div>
    </nav>
    <router-outlet></router-outlet>
  `,
  styles: [`
    nav { background: white; box-shadow: 0 2px 4px rgba(0,0,0,0.1); padding: 15px 0; }
    .nav { max-width: 1200px; margin: 0 auto; padding: 0 20px; display: flex; justify-content: space-between; align-items: center; }
    h2 { margin: 0; cursor: pointer; }
    .links { display: flex; gap: 20px; align-items: center; }
    a { text-decoration: none; color: #333; }
    button { padding: 8px 16px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; }
  `]
})
export class LayoutComponent {
  constructor(public auth: AuthService) { }
}
