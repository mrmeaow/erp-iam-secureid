import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { LoadingService } from '../../../core/services/loading.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './change-password.component.html',
})
export class ChangePasswordComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private loadingService = inject(LoadingService);

  changePasswordForm = this.fb.nonNullable.group({
    oldPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
  });

  isFieldInvalid(name: string) {
    const field = this.changePasswordForm.get(name);
    return field && field.invalid && (field.dirty || field.touched);
  }

  async onSubmit() {
    if (this.changePasswordForm.invalid) {
      this.changePasswordForm.markAllAsTouched();
      return;
    }

    this.loadingService.show();

    try {
      await this.authService.changePassword(this.changePasswordForm.getRawValue());
      this.toastService.success('Security credentials updated successfully.');
      this.changePasswordForm.reset();
    } catch (err: any) {
      console.error('Update failed', err);
      this.toastService.error(
        err.message || 'System rejection. Update of security credentials denied.',
      );
    } finally {
      this.loadingService.hide();
    }
  }
}
