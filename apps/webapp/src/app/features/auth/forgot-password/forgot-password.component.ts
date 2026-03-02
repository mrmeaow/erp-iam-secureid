import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LoadingService } from '../../../core/services/loading.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CommonModule],
  templateUrl: './forgot-password.component.html',
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private loadingService = inject(LoadingService);

  forgotPasswordForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  isFieldInvalid(name: string) {
    const field = this.forgotPasswordForm.get(name);
    return field && field.invalid && (field.dirty || field.touched);
  }

  async onSubmit() {
    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }

    this.loadingService.show();

    try {
      await this.authService.forgotPassword(this.forgotPasswordForm.getRawValue().email);
      this.toastService.success('If identity exists, a reset token has been sent to your email.');
      this.forgotPasswordForm.reset();
    } catch (err: any) {
      console.error('Request failed', err);
      this.toastService.error('System failure. Access to recovery service denied.');
    } finally {
      this.loadingService.hide();
    }
  }
}
