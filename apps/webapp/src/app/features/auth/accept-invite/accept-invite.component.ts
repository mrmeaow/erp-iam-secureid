import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Api } from '../../../core/api/api';
import * as InvitationApi from '../../../core/api/functions';
import { AuthService } from '../../../core/services/auth.service';
import { LoadingService } from '../../../core/services/loading.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-accept-invite',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './accept-invite.component.html',
})
export class AcceptInviteComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(Api);
  private authService = inject(AuthService);
  private toast = inject(ToastService);
  private loading = inject(LoadingService);

  token: string | null = null;
  error: string | null = null;
  isAuthenticated = this.authService.isAuthenticated;

  async ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token');

    if (!this.token) {
      this.error = 'Invalid invitation link.';
      return;
    }

    if (this.isAuthenticated()) {
      await this.acceptInvitation();
    }
  }

  async acceptInvitation() {
    if (!this.token) return;

    this.loading.show();
    try {
      const resp = await this.api.invoke(InvitationApi.invitationControllerAcceptInviteV1, {
        token: this.token,
      });

      if (resp.success) {
        this.toast.success('Invitation accepted successfully!');
        // Refresh token/profile to get new roles
        await this.authService.getMe();
        this.router.navigate(['/dashboard']);
      } else {
        this.error = resp.message || 'Failed to accept invitation.';
      }
    } catch (err: any) {
      this.error =
        err.error?.message ||
        'Failed to accept invitation. Please ensure you are logged in with the correct email address.';
    } finally {
      this.loading.hide();
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/auth/login'], {
      queryParams: { returnUrl: `/auth/accept-invite?token=${this.token}` },
    });
  }

  get loginUrl() {
    return `/auth/login`;
  }

  get registerUrl() {
    return `/auth/register-user`;
  }

  get queryParams() {
    return { returnUrl: `/auth/accept-invite?token=${this.token}` };
  }
}
