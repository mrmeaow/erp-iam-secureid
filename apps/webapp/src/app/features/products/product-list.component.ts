import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { Api } from '../../core/api/api';
import * as ProductApi from '../../core/api/functions';
import { ApiResponseDto } from '../../core/api/models/api-response-dto';
import { HasPermissionDirective } from '../../core/directives/has-permission.directive';
import { CanAccessPipe } from '../../core/pipes/can-access.pipe';
import { AccessControlService } from '../../core/services/access-control.service';
import { LoadingService } from '../../core/services/loading.service';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, HasPermissionDirective, CanAccessPipe],
  templateUrl: './product-list.component.html',
})
export class ProductListComponent implements OnInit {
  private readonly api = inject(Api);
  private readonly accessControl = inject(AccessControlService);
  private readonly loading = inject(LoadingService);

  products = signal<any[]>([]);

  async ngOnInit() {
    await this.loadProducts();
  }

  async loadProducts() {
    this.loading.show();
    try {
      const response = await this.api.invoke(ProductApi.productControllerFindAllV1, {}) as unknown as ApiResponseDto;
      if (response.success) {
        this.products.set(response.data as any[]);
      }
    } finally {
      this.loading.hide();
    }
  }

  async deleteProduct(product: any) {
    if (!confirm(`Are you sure you want to delete ${product.name}?`)) return;
    
    this.loading.show();
    try {
      await this.api.invoke(ProductApi.productControllerRemoveV1, {
        id: product.product_id,
      });
      await this.loadProducts();
    } finally {
      this.loading.hide();
    }
  }

  async createProduct() {
    const name = prompt('Product name');
    if (!name) return;
    const sku = prompt('SKU', '') || undefined;
    const priceRaw = prompt('Price', '0') || '0';
    const price = Number(priceRaw);

    this.loading.show();
    try {
      await this.api.invoke(ProductApi.productControllerCreateV1, {
        body: {
          name,
          sku,
          price: Number.isFinite(price) ? price : 0,
        },
      });
      await this.loadProducts();
    } finally {
      this.loading.hide();
    }
  }

  async editProduct(product: any) {
    const name = prompt('Update product name', product.name || '');
    if (!name) return;
    const priceRaw = prompt('Update price', String(product.price ?? 0)) || '0';
    const price = Number(priceRaw);

    this.loading.show();
    try {
      await this.api.invoke(ProductApi.productControllerUpdateV1, {
        id: product.product_id,
        body: {
          name,
          price: Number.isFinite(price) ? price : product.price,
        },
      });
      await this.loadProducts();
    } finally {
      this.loading.hide();
    }
  }

  viewProduct(product: any) {
    const lines = [
      `Name: ${product.name ?? '-'}`,
      `SKU: ${product.sku ?? '-'}`,
      `Price: ${product.price ?? '-'}`,
      `Product ID: ${product.product_id ?? '-'}`,
    ];
    alert(lines.join('\n'));
  }

  // Example for complex field level check or action check helper
  canEdit(product: any): boolean {
    return this.accessControl.can('PRODUCTS', 'WRITE', product);
  }
}
