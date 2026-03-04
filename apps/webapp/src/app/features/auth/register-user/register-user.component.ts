import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LoadingService } from '../../../core/services/loading.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-register-user',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CommonModule],
  templateUrl: './register-user.component.html',
})
export class RegisterUserComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toastService = inject(ToastService);
  private loadingService = inject(LoadingService);

  registerForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
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
      const payload = this.registerForm.getRawValue();
      await this.authService.registerUser(payload);
      this.toastService.success('Account created! Please verify your email.');
      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/dashboard';
      this.router.navigateByUrl(returnUrl);
    } catch (err: any) {
      console.error('Registration failed', err);
      this.toastService.error(err.error?.message || 'Registration failed.');
    } finally {
      this.loadingService.hide();
    }
  }
}
