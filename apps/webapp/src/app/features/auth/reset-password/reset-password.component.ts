import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LoadingService } from '../../../core/services/loading.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CommonModule],
  templateUrl: './reset-password.component.html',
})
export class ResetPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toastService = inject(ToastService);
  private loadingService = inject(LoadingService);

  private token = '';

  resetPasswordForm = this.fb.nonNullable.group({
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
  });

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    if (!this.token) {
      this.toastService.error('Invalid security token. Operation aborted.');
      this.router.navigate(['/auth/login']);
    }
  }

  isFieldInvalid(name: string) {
    const field = this.resetPasswordForm.get(name);
    return field && field.invalid && (field.dirty || field.touched);
  }

  async onSubmit() {
    if (this.resetPasswordForm.invalid) {
      this.resetPasswordForm.markAllAsTouched();
      return;
    }

    this.loadingService.show();

    try {
      await this.authService.resetPassword({
        token: this.token,
        newPassword: this.resetPasswordForm.getRawValue().newPassword,
      });
      this.toastService.success('Security credentials updated. You may now log in.');
      this.router.navigate(['/auth/login']);
    } catch (err: any) {
      console.error('Reset failed', err);
      this.toastService.error(
        err.message || 'Operation failed. System rejected credential update.',
      );
    } finally {
      this.loadingService.hide();
    }
  }
}
