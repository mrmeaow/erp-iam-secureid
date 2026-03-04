import { Hash } from '#lib/hash';
import { AppConfigService } from '#shared/modules/app-config/app-config.service';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';
import { MailService } from '../../shared/modules/mail/mail.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { RoleService } from '../role/role.service';
import { TenantService } from '../tenant/tenant.service';
import { UserService } from '../user/user.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { SessionService } from './services/session.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly tenantService: TenantService,
    private readonly roleService: RoleService,
    private readonly sessionService: SessionService,
    private readonly jwtService: JwtService,
    private readonly config: AppConfigService,
    private readonly auditLogService: AuditLogService,
    private readonly mailService: MailService,
  ) {}

  async register(registerDto: RegisterDto) {
    // Check if user already exists
    const existing = await this.userService.findByEmail(registerDto.email);
    if (existing) {
      throw new ConflictException('User already registered in the system');
    }

    const hashedPassword = await Hash.make(registerDto.password);
    const verificationToken = randomBytes(32).toString('hex');

    // 1. Create User
    const user = await this.userService.create({
      email: registerDto.email,
      name: registerDto.name,
      hashed_password: hashedPassword,
      is_active: true,
      is_verified: false,
      verification_token: verificationToken,
    });

    // 2. Create Tenant (Optional)
    let tenant_id: string | undefined;

    if (registerDto.companyName) {
      const tenant = await this.tenantService.create(registerDto.companyName);
      tenant_id = tenant.tenant_id;

      // 3. Ensure Default Roles for this Tenant and get OWNER role
      const ownerRole = await this.roleService.ensureDefaultRoles(tenant_id);

      // 4. Create Membership (Owner)
      await this.tenantService.createMembership(
        tenant_id,
        user.user_id,
        ownerRole.role_id,
      );

      await this.auditLogService.log({
        action: 'user.registered_with_tenant',
        actor_id: user.user_id,
        actor_email: user.email,
        tenant_id: tenant_id,
        payload: { email: user.email, company: registerDto.companyName },
      });
    } else {
      await this.auditLogService.log({
        action: 'user.registered',
        actor_id: user.user_id,
        actor_email: user.email,
        payload: { email: user.email },
      });
    }

    // For session, we need a tenant context. If no tenant, they get a user-only session.
    const tokens = await this.sessionService.createSession(user, tenant_id);

    // 5. Send Emails (Async via BullMQ)
    await this.mailService.sendWelcomeEmail({
      email: user.email,
    });

    await this.mailService.sendVerificationEmail({
      email: user.email,
      token: verificationToken,
    });

    return tokens;
  }

  async registerUser(registerDto: RegisterUserDto) {
    const existing = await this.userService.findByEmail(registerDto.email);
    if (existing) {
      throw new ConflictException('User already registered in the system');
    }

    const hashedPassword = await Hash.make(registerDto.password);
    const verificationToken = randomBytes(32).toString('hex');

    const user = await this.userService.create({
      email: registerDto.email,
      name: registerDto.name,
      hashed_password: hashedPassword,
      is_active: true,
      is_verified: false,
      verification_token: verificationToken,
    });

    await this.auditLogService.log({
      action: 'user.registered_only',
      actor_id: user.user_id,
      actor_email: user.email,
      payload: { email: user.email },
    });

    const tokens = await this.sessionService.createSession(user);

    await this.mailService.sendWelcomeEmail({ email: user.email });
    await this.mailService.sendVerificationEmail({
      email: user.email,
      token: verificationToken,
    });

    return tokens;
  }

  async login(loginDto: LoginDto) {
    const user = await this.userService.findByEmail(loginDto.email);

    if (!user || !user.is_active || !user.hashed_password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await Hash.verify(user.hashed_password, loginDto.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.userService.updateLastLogin(user.user_id);

    await this.auditLogService.log({
      action: 'user.login',
      actor_id: user.user_id,
      actor_email: user.email,
    });

    return this.sessionService.createSession(user);
  }

  async refresh(refreshDto: RefreshDto) {
    try {
      const payload = await this.jwtService.verifyAsync(
        refreshDto.refreshToken,
        {
          secret: this.config.jwt.publicKey,
          issuer: this.config.jwt.issuer,
          audience: this.config.jwt.audience,
        },
      );

      const isValid = await this.sessionService.validateSession(
        payload.sub,
        payload.jti,
      );

      if (!isValid) {
        throw new UnauthorizedException('Session revoked or expired');
      }

      // Revoke the old session, create a new one to rotate token
      await this.sessionService.revokeSession(payload.sub, payload.jti);

      const user = await this.userService.findById(payload.sub);
      if (!user) throw new UnauthorizedException('User not found');

      return this.sessionService.createSession(user, payload.tenantId);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string, jti: string) {
    await this.sessionService.revokeSession(userId, jti);
  }

  async switchTenant(userId: string, jti: string, tenantId: string) {
    const hasMembership = await this.tenantService.hasActiveMembership(
      tenantId,
      userId,
    );
    if (!hasMembership) {
      throw new UnauthorizedException('No active membership for target tenant');
    }

    const user = await this.userService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    await this.sessionService.revokeSession(userId, jti);
    const tokens = await this.sessionService.createSession(user, tenantId);

    await this.auditLogService.log({
      action: 'user.tenant_switched',
      actor_id: user.user_id,
      actor_email: user.email,
      tenant_id: tenantId,
      payload: { from_session: jti },
    });

    return tokens;
  }

  async getProfile(userId: string, tenantId?: string) {
    const user = await this.userService.findById(userId);
    if (!user) throw new UnauthorizedException('User not found');

    let roles: string[] = [];
    let permissions: string[] = [];

    if (tenantId) {
      const membership = await this.tenantService.membershipRepository.findOne({
        where: { user_id: userId, tenant_id: tenantId, is_active: true },
        relations: ['role', 'role.permissions'],
      });

      if (membership) {
        if (membership.role) {
          roles.push(membership.role.name);
          permissions = (membership.role.permissions || []).map(
            (p) => `${p.resource}:${p.action}`,
          );
        }

        // Add custom overrides if any
        if (membership.permissions) {
          // Logic for overrides can be complex, for now we merge or replace?
          // Usually custom ones take precedence or are additive.
          // Let's assume they are additive for now.
        }
      }
    }

    return {
      sub: user.user_id,
      email: user.email,
      tenantId: tenantId,
      isVerified: user.is_verified,
      roles,
      permissions,
      jti: '', // Optional in DTO or filled by controller if needed
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.userService.findByEmail(forgotPasswordDto.email);
    if (user) {
      const resetToken = randomBytes(32).toString('hex');
      const resetExpiresAt = new Date();
      resetExpiresAt.setHours(resetExpiresAt.getHours() + 1); // 1 hour expiry

      await this.userService.update(user.user_id, {
        reset_token: resetToken,
        reset_expires_at: resetExpiresAt,
      });

      await this.mailService.sendPasswordResetEmail({
        email: user.email,
        token: resetToken,
      });

      await this.auditLogService.log({
        action: 'user.forgot_password_requested',
        actor_id: user.user_id,
        actor_email: user.email,
      });
    }
    return {
      success: true,
      message: 'If an account exists, a reset link has been sent.',
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const user = await this.userService.findByResetToken(
      resetPasswordDto.token,
    );

    if (!user || !user.reset_expires_at || user.reset_expires_at < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashedPassword = await Hash.make(resetPasswordDto.newPassword);
    await this.userService.update(user.user_id, {
      hashed_password: hashedPassword,
      reset_token: undefined,
      reset_expires_at: undefined,
    });

    await this.auditLogService.log({
      action: 'user.password_reset_success',
      actor_id: user.user_id,
      actor_email: user.email,
    });

    return { success: true };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const user = await this.userService.findById(userId);
    if (!user || !user.hashed_password) {
      throw new UnauthorizedException('User not found');
    }

    const isMatch = await Hash.verify(
      user.hashed_password,
      changePasswordDto.oldPassword,
    );
    if (!isMatch) {
      throw new UnauthorizedException('Invalid old password');
    }

    const hashedPassword = await Hash.make(changePasswordDto.newPassword);
    await this.userService.updatePassword(userId, hashedPassword);

    await this.auditLogService.log({
      action: 'user.password_changed',
      actor_id: userId,
      actor_email: user.email,
    });

    return { success: true };
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto) {
    const user = await this.userService.findByVerificationToken(
      verifyEmailDto.token,
    );
    if (!user) {
      throw new BadRequestException('Invalid verification token');
    }

    await this.userService.update(user.user_id, {
      is_verified: true,
      verification_token: undefined,
    });

    await this.auditLogService.log({
      action: 'user.email_verified',
      actor_id: user.user_id,
      actor_email: user.email,
    });

    return { success: true };
  }
}
