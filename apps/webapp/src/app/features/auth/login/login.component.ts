import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LoadingService } from '../../../core/services/loading.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CommonModule],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private loadingService = inject(LoadingService);

  loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  isFieldInvalid(name: string) {
    const field = this.loginForm.get(name);
    return field && field.invalid && (field.dirty || field.touched);
  }

  async onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loadingService.show();

    try {
      await this.authService.login(this.loginForm.getRawValue());
      this.toastService.success('Identity verified. Welcome back!');
      this.router.navigate(['/dashboard']);
    } catch (err: any) {
      console.error('Login failed', err);
      this.toastService.error(
        err.error?.message || 'Unauthorized access. Please check your credentials.',
      );
    } finally {
      this.loadingService.hide();
    }
  }
}
