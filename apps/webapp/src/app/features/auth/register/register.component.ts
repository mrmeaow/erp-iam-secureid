import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LoadingService } from '../../../core/services/loading.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CommonModule],
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private loadingService = inject(LoadingService);

  registerForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    companyName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  isFieldInvalid(name: string) {
    const field = this.registerForm.get(name);
    return field && field.invalid && (field.dirty || field.touched);
  }

  async onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.loadingService.show();

    try {
      await this.authService.register(this.registerForm.getRawValue());
      this.toastService.success('Organization identity initialized! Please verify your email.');
      this.router.navigate(['/dashboard']);
    } catch (err: any) {
      console.error('Registration failed', err);
      this.toastService.error(
        err.error?.message || 'Registration failed. System rejected identity creation.',
      );
    } finally {
      this.loadingService.hide();
    }
  }
}
