import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { Api } from '../../core/api/api';
import * as ProductApi from '../../core/api/functions';
import { CreateProductDto, ProductDto, UpdateProductDto } from '../../core/api/models';
import { HasPermissionDirective } from '../../core/directives/has-permission.directive';
import { CanAccessPipe } from '../../core/pipes/can-access.pipe';
import { AccessControlService } from '../../core/services/access-control.service';
import { LoadingService } from '../../core/services/loading.service';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { ProductFormModalComponent } from './product-form-modal/product-form-modal.component';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule,
    HasPermissionDirective,
    CanAccessPipe,
    ProductFormModalComponent,
    PaginationComponent,
  ],
  templateUrl: './product-list.component.html',
})
export class ProductListComponent implements OnInit {
  private readonly api = inject(Api);
  private readonly accessControl = inject(AccessControlService);
  private readonly loading = inject(LoadingService);

  products = signal<ProductDto[]>([]);

  isModalOpen = signal(false);
  isViewMode = signal(false);
  selectedProduct = signal<ProductDto | null>(null);

  page = signal(1);
  limit = signal(10);
  totalItems = signal(0);
  totalPages = signal(1);

  async ngOnInit() {
    await this.loadProducts();
  }

  async loadProducts() {
    this.loading.show();
    try {
      const response: any = await this.api.invoke(ProductApi.productControllerFindAllV1, {
        page: this.page(),
        limit: this.limit(),
      });
      if (response && response.success && response.data) {
        this.products.set(response.data as ProductDto[]);
        if (response.meta) {
          const meta = response.meta as any;
          this.page.set(meta.page || 1);
          this.totalItems.set(meta.total || 0);
          this.totalPages.set(meta.totalPages || 1);
        }
      }
    } finally {
      this.loading.hide();
    }
  }

  async deleteProduct(product: ProductDto) {
    if (!confirm(`Are you sure you want to delete ${product.name}?`)) return;

    this.loading.show();
    try {
      const response: any = await this.api.invoke(ProductApi.productControllerRemoveV1, {
        id: product.product_id,
      });
      if (response && response.success) {
        await this.loadProducts();
      }
    } finally {
      this.loading.hide();
    }
  }

  createProduct() {
    this.selectedProduct.set(null);
    this.isViewMode.set(false);
    this.isModalOpen.set(true);
  }

  editProduct(product: ProductDto) {
    this.selectedProduct.set(product);
    this.isViewMode.set(false);
    this.isModalOpen.set(true);
  }

  async handleSave(event: { isEdit: boolean; data: CreateProductDto | UpdateProductDto }) {
    this.loading.show();
    try {
      if (event.isEdit && this.selectedProduct()) {
        const response: any = await this.api.invoke(ProductApi.productControllerUpdateV1, {
          id: this.selectedProduct()!.product_id,
          body: event.data as UpdateProductDto,
        });
        if (!response.success) throw new Error(response.message);
      } else {
        const response: any = await this.api.invoke(ProductApi.productControllerCreateV1, {
          body: event.data as CreateProductDto,
        });
        if (!response.success) throw new Error(response.message);
      }
      this.isModalOpen.set(false);
      await this.loadProducts();
    } finally {
      this.loading.hide();
    }
  }

  viewProduct(product: ProductDto) {
    this.selectedProduct.set(product);
    this.isViewMode.set(true);
    this.isModalOpen.set(true);
  }

  canEdit(product: ProductDto): boolean {
    return this.accessControl.can('PRODUCTS', 'WRITE', product);
  }

  onPageChange(newPage: number) {
    this.page.set(newPage);
    this.loadProducts();
  }
}
