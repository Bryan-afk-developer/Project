import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Flower } from '../../../core/services/flowers.service';

@Component({
  selector: 'app-flower-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flower-card">
      <div class="badge-container">
        <span class="badge badge-published">Publicada</span>
      </div>
      <img [src]="flower.image" [alt]="flower.name" class="flower-image">
      <!-- Overlay or details could go here -->
    </div>
  `,
  styles: [`
    .flower-card {
      position: relative;
      border-radius: 12px;
      overflow: hidden;
      aspect-ratio: 4/3;
      box-shadow: 0 4px 10px rgba(0,0,0,0.1);
      transition: transform 0.2s;
      cursor: pointer;
    }
    .flower-card:hover {
      transform: translateY(-5px);
    }
    .flower-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .badge-container {
      position: absolute;
      top: 10px;
      right: 10px;
      z-index: 10;
    }
    .badge {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
      color: white;
    }
    .badge-published {
      background-color: #2e7d32; /* Green */
    }
  `]
})
export class FlowerCardComponent {
  @Input({ required: true }) flower!: Flower;
}
