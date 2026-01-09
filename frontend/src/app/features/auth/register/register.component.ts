import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    template: `
    <div class="register-container">
      <div class="register-card">
        <h1>Join Azzuna</h1>
        <p class="subtitle">Create your account</p>

        <form (ngSubmit)="onSubmit()" #registerForm="ngForm">
          <div class="form-row">
            <div class="form-group">
              <label for="first_name">First Name *</label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                [(ngModel)]="formData.first_name"
                required
                minlength="2"
                placeholder="John"
              />
            </div>

            <div class="form-group">
              <label for="last_name">Last Name</label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                [(ngModel)]="formData.last_name"
                placeholder="Doe"
              />
            </div>
          </div>

          <div class="form-group">
            <label for="email">Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              [(ngModel)]="formData.email"
              required
              email
              placeholder="your@email.com"
            />
          </div>

          <div class="form-group">
            <label for="password">Password *</label>
            <input
              type="password"
              id="password"
              name="password"
              [(ngModel)]="formData.password"
              required
              minlength="6"
              pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+"
              placeholder="Min. 6 characters with uppercase, lowercase, and number"
            />
          </div>

          <div class="form-group">
            <label for="phone">Phone</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              [(ngModel)]="formData.phone"
              placeholder="+1234567890"
            />
          </div>

          <div class="form-group">
            <label for="role">I am a:</label>
            <select id="role" name="role" [(ngModel)]="formData.role">
              <option value="client">Client (Buy flowers)</option>
              <option value="florist">Florist (Sell flowers)</option>
            </select>
          </div>

          @if (errorMessage) {
            <div class="error-message">{{ errorMessage }}</div>
          }

          <button type="submit" [disabled]="!registerForm.valid || isLoading">
            {{ isLoading ? 'Creating account...' : 'Create Account' }}
          </button>
        </form>

        <p class="login-link">
          Already have an account?
          <a routerLink="/login">Login</a>
        </p>
      </div>
    </div>
  `,
    styles: [`
    .register-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .register-card {
      background: white;
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
      max-width: 500px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
    }

    h1 {
      margin: 0 0 10px;
      color: #333;
      text-align: center;
    }

    .subtitle {
      text-align: center;
      color: #666;
      margin-bottom: 30px;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    label {
      display: block;
      margin-bottom: 8px;
      color: #555;
      font-weight: 500;
    }

    input, select {
      width: 100%;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 14px;
      transition: border-color 0.3s;
      box-sizing: border-box;
    }

    input:focus, select:focus {
      outline: none;
      border-color: #667eea;
    }

    button {
      width: 100%;
      padding: 12px;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.3s;
    }

    button:hover:not(:disabled) {
      background: #5568d3;
    }

    button:disabled {
      background: #ccc;
      cursor: not-allowed;
    }

    .error-message {
      background: #fee;
      color: #c33;
      padding: 12px;
      border-radius: 6px;
      margin-bottom: 20px;
      text-align: center;
      font-size: 14px;
    }

    .login-link {
      text-align: center;
      margin-top: 20px;
      color: #666;
    }

    .login-link a {
      color: #667eea;
      text-decoration: none;
      font-weight: 600;
    }

    .login-link a:hover {
      text-decoration: underline;
    }
  `]
})
export class RegisterComponent {
    formData = {
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        phone: '',
        role: 'client'
    };

    errorMessage = '';
    isLoading = false;

    constructor(
        private authService: AuthService,
        private router: Router
    ) { }

    onSubmit(): void {
        this.isLoading = true;
        this.errorMessage = '';

        this.authService.register(this.formData).subscribe({
            next: (response) => {
                this.isLoading = false;
                this.router.navigate(['/']);
            },
            error: (error) => {
                this.isLoading = false;
                this.errorMessage = error.message || 'Registration failed. Please try again.';
            }
        });
    }
}
