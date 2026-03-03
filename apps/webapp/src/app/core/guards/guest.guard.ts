import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const guestGuard = (
  _route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Verification links can be opened while user already has a session.
  if (state.url.startsWith('/auth/verify-email')) {
    return true;
  }

  if (authService.isAuthenticated() || !!authService.getAccessToken()) {
    return router.parseUrl('/dashboard');
  }

  return true;
};
