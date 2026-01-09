import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FlowersService } from '../../core/services/flowers.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container">
      <h1>🌸 Azzuna Flowers</h1>
      <p *ngIf="loading">Loading...</p>
      <div class="grid">
        <div *ngFor="let flower of flowers" class="card" [routerLink]="['/flower', flower.id]">
          <img [src]="flower.image" [alt]="flower.name">
          <h3>{{flower.name}}</h3>
          <p class="price">\${{flower.price}}</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    h1 { text-align: center; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px; margin-top: 30px; }
    .card { border: 1px solid #ddd; border-radius: 8px; padding: 15px; cursor: pointer; }
    .card:hover { box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
    .card img { width: 100%; height: 200px; object-fit: cover; border-radius: 4px; }
    .price { color: #667eea; font-weight: bold; font-size: 18px; }
  `]
})
export class HomeComponent implements OnInit {
  flowers: any[] = [];
  loading = true;

  constructor(private flowersService: FlowersService) { }

  ngOnInit() {
    this.flowersService.getFlowers({}).subscribe({
      next: (res) => { this.flowers = res.data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }
}
