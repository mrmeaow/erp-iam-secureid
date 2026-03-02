import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { LoadingService } from '../services/loading.service';

@Component({
  selector: 'app-loading-overlay',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loading-overlay.component.html',
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class LoadingOverlayComponent {
  private loadingService = inject(LoadingService);
  isLoading = this.loadingService.isLoading;
}
