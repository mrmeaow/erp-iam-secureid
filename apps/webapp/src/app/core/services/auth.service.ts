import { inject, Injectable, signal } from '@angular/core';
import { Api } from '../api/api';
import * as AuthApi from '../api/functions';
import {
  ChangePasswordDto as ApiChangePasswordDto,
  ForgotPasswordDto as ApiForgotPasswordDto,
  LoginDto as ApiLoginDto,
  RegisterDto as ApiRegisterDto,
  ResetPasswordDto as ApiResetPasswordDto,
  VerifyEmailDto as ApiVerifyEmailDto,
} from '../api/models';
import { AuthTokens, LoginDto, RegisterDto, UserProfile } from '../models/auth.models';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly api = inject(Api);
  private readonly TOKEN_KEY = 'auth_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';

  currentUser = signal<UserProfile | null>(null);
  isAuthenticated = signal<boolean>(false);

  constructor() {
    this.bootSession();
  }

  private async bootSession() {
    const token = this.getAccessToken();
    if (token) {
      try {
        // 1. Decipher user immediately for UI
        const payload = JSON.parse(atob(token.split('.')[1])) as UserProfile;
        this.currentUser.set(payload);
        this.isAuthenticated.set(true);

        // 2. Background verify profile for fresh data
        await this.getMe();
      } catch {
        await this.logout();
      }
    }
  }

  async login(dto: LoginDto): Promise<AuthTokens> {
    const response = await this.api.invoke(AuthApi.authControllerLoginV1, {
      body: dto as ApiLoginDto,
    });

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Login failed');
    }

    const tokens = response.data as AuthTokens;
    this.setSession(tokens);
    return tokens;
  }

  async register(dto: RegisterDto): Promise<AuthTokens> {
    const response = await this.api.invoke(AuthApi.authControllerRegisterV1, {
      body: dto as ApiRegisterDto,
    });

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Registration failed');
    }

    const tokens = response.data as AuthTokens;
    this.setSession(tokens);
    return tokens;
  }

  async refresh(): Promise<AuthTokens> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) throw new Error('No refresh token available');

    const response = await this.api.invoke(AuthApi.authControllerRefreshV1, {
      body: { refreshToken },
    });

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Refresh failed');
    }

    const tokens = response.data as AuthTokens;
    this.setSession(tokens);
    return tokens;
  }

  async getMe(): Promise<UserProfile> {
    const response = await this.api.invoke(AuthApi.authControllerGetMeV1, {});

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch profile');
    }

    const profile = response.data as UserProfile;
    this.currentUser.set(profile);
    return profile;
  }

  private setSession(tokens: AuthTokens) {
    localStorage.setItem(this.TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, tokens.refreshToken);

    // Immediate state update from JWT
    const payload = JSON.parse(atob(tokens.accessToken.split('.')[1])) as UserProfile;
    this.currentUser.set(payload);
    this.isAuthenticated.set(true);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  async logout() {
    try {
      await this.api.invoke(AuthApi.authControllerLogoutV1, {});
    } catch {
      // Ignore if session already invalid on server
    } finally {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
      this.isAuthenticated.set(false);
      this.currentUser.set(null);
    }
  }

  async forgotPassword(email: string): Promise<void> {
    const response: any = await this.api.invoke(AuthApi.authControllerForgotPasswordV1, {
      body: { email } as ApiForgotPasswordDto,
    });
    if (!response.success) throw new Error(response.message || 'Request failed');
  }

  async resetPassword(dto: ApiResetPasswordDto): Promise<void> {
    const response: any = await this.api.invoke(AuthApi.authControllerResetPasswordV1, {
      body: dto,
    });
    if (!response.success) throw new Error(response.message || 'Reset failed');
  }

  async verifyEmail(token: string): Promise<void> {
    const response: any = await this.api.invoke(AuthApi.authControllerVerifyEmailV1, {
      body: { token } as ApiVerifyEmailDto,
    });
    if (!response.success) throw new Error(response.message || 'Verification failed');
  }

  async changePassword(dto: ApiChangePasswordDto): Promise<void> {
    const response: any = await this.api.invoke(AuthApi.authControllerChangePasswordV1, {
      body: dto,
    });
    if (!response.success) throw new Error(response.message || 'Change failed');
  }
}
