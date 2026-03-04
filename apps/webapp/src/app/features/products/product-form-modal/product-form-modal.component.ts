import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreateProductDto, ProductDto, UpdateProductDto } from '../../../core/api/models';
import { ModalComponent } from '../../../shared/components/modal/modal.component';

@Component({
  selector: 'app-product-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent],
  templateUrl: './product-form-modal.component.html',
})
export class ProductFormModalComponent implements OnInit {
  private fb = inject(FormBuilder);

  @Input() isOpen = false;
  @Input() product: ProductDto | null = null;
  @Input() isViewMode = false;

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<{
    isEdit: boolean;
    data: CreateProductDto | UpdateProductDto;
  }>();

  productForm!: FormGroup;

  ngOnInit() {
    this.initForm();
  }

  ngOnChanges() {
    this.initForm();
    if (this.product && this.productForm) {
      this.productForm.patchValue({
        name: this.product.name,
        sku: this.product.sku || '',
        price: this.product.price,
        quantity: this.product.quantity || 0,
      });
    }
    if (this.isViewMode) {
      this.productForm.disable();
    } else {
      this.productForm.enable();
    }
  }

  initForm() {
    if (!this.productForm) {
      this.productForm = this.fb.nonNullable.group({
        name: ['', [Validators.required, Validators.maxLength(255)]],
        sku: ['', [Validators.maxLength(100)]],
        price: [0, [Validators.required, Validators.min(0)]],
        quantity: [0, [Validators.required, Validators.min(0)]],
      });
    } else if (!this.product) {
      this.productForm.reset({ price: 0, quantity: 0 });
    }
  }

  isFieldInvalid(name: string) {
    const field = this.productForm.get(name);
    return field && field.invalid && (field.dirty || field.touched);
  }

  onSubmit() {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    const formValue = this.productForm.getRawValue();
    // Ensure numbers
    formValue.price = Number(formValue.price);
    formValue.quantity = Number(formValue.quantity);

    // Optional SKU
    if (!formValue.sku) {
      delete formValue.sku;
    }

    this.save.emit({
      isEdit: !!this.product,
      data: formValue,
    });
  }
}
