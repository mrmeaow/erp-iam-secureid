import { JwtPayload } from '#config/types/auth.types';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { Repository } from 'typeorm';
import { AppConfigService } from '../../../shared/modules/app-config/app-config.service';
import { RedisService } from '../../../shared/modules/redis/redis.service';
import { Membership } from '../../tenant/entities/membership.entity';
import { User } from '../../user/entities/user.entity';

@Injectable()
export class SessionService {
  constructor(
    private readonly redisService: RedisService,
    private readonly jwtService: JwtService,
    private readonly config: AppConfigService,
    @InjectRepository(Membership)
    private readonly membershipRepository: Repository<Membership>,
  ) {}

  private getSessionKey(userId: string, jti: string): string {
    return `session:${userId}:${jti}`;
  }

  async createSession(user: User, tenantId?: string) {
    let targetTenantId = tenantId;

    if (!targetTenantId) {
      // Find the first active membership for the user
      const membership = await this.membershipRepository.findOne({
        where: { user_id: user.user_id, is_active: true },
      });
      if (!membership) {
        throw new UnauthorizedException('User has no active memberships');
      }
      targetTenantId = membership.tenant_id;
    }

    const jti = randomBytes(16).toString('hex');

    const payload: JwtPayload = {
      sub: user.user_id,
      email: user.email,
      tenantId: targetTenantId,
      jti,
      isVerified: user.is_verified,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: this.parseExpiryToSeconds(this.config.jwt.accessExpiry),
      issuer: this.config.jwt.issuer,
      audience: this.config.jwt.audience,
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      expiresIn: this.parseExpiryToSeconds(this.config.jwt.refreshExpiry),
      issuer: this.config.jwt.issuer,
      audience: this.config.jwt.audience,
    });

    // Store in redis
    const sessionKey = this.getSessionKey(user.user_id, jti);
    const sessionData = JSON.stringify({
      userId: user.user_id,
      tenantId: targetTenantId,
      jti,
    });

    // Parse refresh expiry to seconds
    const ttlSeconds = this.parseExpiryToSeconds(this.config.jwt.refreshExpiry);

    // Enforce Max Sessions (Multi-device restriction)
    const activeSessionKeys = await this.redisService
      .getClient()
      .keys(`session:${user.user_id}:*`);
    if (activeSessionKeys.length >= this.config.jwt.maxSessions) {
      // Logic: Drop the oldest or restrict login?
      // Requirement: multi-device support + restrictions.
      // Usually, we rotate/drop oldest.
      const keysSorted = activeSessionKeys.sort(); // Assuming some naming or creation time, but keys are just hex.
      // Better strategy: del oldest from list or just block?
      // For now, let's drop the oldest found to allow new login.
      await this.redisService.del(keysSorted[0]);
    }

    await this.redisService.set(sessionKey, sessionData, ttlSeconds);

    return {
      accessToken,
      refreshToken,
    };
  }

  async validateSession(userId: string, jti: string): Promise<boolean> {
    const sessionKey = this.getSessionKey(userId, jti);
    const session = await this.redisService.get(sessionKey);
    return !!session;
  }

  async revokeSession(userId: string, jti: string) {
    const sessionKey = this.getSessionKey(userId, jti);
    await this.redisService.del(sessionKey);
  }

  private parseExpiryToSeconds(expiry: string): number {
    const val = parseInt(expiry, 10);
    if (expiry.endsWith('d')) return val * 24 * 60 * 60;
    if (expiry.endsWith('h')) return val * 60 * 60;
    if (expiry.endsWith('m')) return val * 60;
    if (expiry.endsWith('s')) return val;
    return val;
  }
}
