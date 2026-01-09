import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FlowersService } from '../../core/services/flowers.service';

@Component({
    selector: 'app-detail',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
    <div class="container" *ngIf="flower">
      <button routerLink="/" class="back">← Back</button>
      <div class="detail">
        <img [src]="flower.image" [alt]="flower.name">
        <div>
          <h1>{{flower.name}}</h1>
          <p class="price">\${{flower.price}}</p>
          <p>{{flower.description}}</p>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .container { max-width: 1200px; margin: 40px auto; padding: 20px; }
    .back { padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer; }
    .detail { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 20px; }
    .detail img { width: 100%; border-radius: 8px; }
    .price { color: #667eea; font-size: 32px; font-weight: bold; }
  `]
})
export class DetailComponent implements OnInit {
    flower: any;

    constructor(private route: ActivatedRoute, private flowersService: FlowersService) { }

    ngOnInit() {
        const id = this.route.snapshot.params['id'];
        this.flowersService.getFlowerById(id).subscribe(res => this.flower = res.data);
    }
}
