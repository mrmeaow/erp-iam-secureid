import { JwtPayload } from '#config/types/auth.types';
import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogService } from '../../audit-log/audit-log.service';
import { Membership } from '../../tenant/entities/membership.entity';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { AuthGuard } from './auth.guard';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(Membership)
    private readonly membershipRepository: Repository<Membership>,
    private readonly auditLogService: AuditLogService,
    private readonly authGuard: AuthGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    // When used globally, this guard may run before route-level AuthGuard.
    if (!request['user']) {
      await this.authGuard.canActivate(context);
    }
    const user = request['user'] as JwtPayload;

    if (!user || !user.tenantId) {
      return false;
    }

    // Resolve user permissions for the current tenant
    const membership = await this.membershipRepository.findOne({
      where: {
        user_id: user.sub,
        tenant_id: user.tenantId,
        is_active: true,
      },
      relations: ['role', 'role.permissions'],
    });

    if (!membership) {
      throw new ForbiddenException('No active membership found for this tenant');
    }

    // 1. Collect Role Permissions
    const rolePermissions =
      membership.role?.permissions.map((p) => ({
        resource: p.resource,
        action: p.action,
        condition: null, // Roles usually don't have per-record conditions in this simple model, but could be added.
      })) || [];

    // 2. Collect Direct Membership Permissions (ABAC/ACL overrides)
    // membership.permissions is JSONB: Array<{ resource, action, condition? }>
    const directPermissions = Array.isArray(membership.permissions)
      ? membership.permissions
      : [];

    const allPermissions = [...rolePermissions, ...directPermissions];

    // 3. Check for specific permission MATCH
    const hasPermission = requiredPermissions.every((requiredPerm) => {
      const [res, act] = requiredPerm.split(':');

      const match = allPermissions.find(
        (p) => p.resource === res && p.action === act,
      );

      if (!match) return false;

      // 4. ABAC Condition Evaluation
      if (match.condition) {
        return this.evaluateCondition(match.condition, request);
      }

      return true;
    });

    // Log the authorization event
    await this.auditLogService.log({
      action: hasPermission ? 'AUTHORIZATION_SUCCESS' : 'AUTHORIZATION_FAILURE',
      actor_id: user.sub,
      actor_email: user.email,
      tenant_id: user.tenantId,
      resource_type: context.getClass().name,
      resource_id: context.getHandler().name,
      payload: {
        required: requiredPermissions,
        hasPermission,
      },
    });

    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions or failed condition');
    }

    return true;
  }

  private evaluateCondition(condition: any, request: any): boolean {
    const user = request['user'] as JwtPayload;
    const body = request.body;
    const params = request.params;

    // Simple evaluator for record-level ACLs
    // Example condition: { type: 'owner', field: 'owner_id' }
    if (condition.type === 'owner') {
      // Check if the record being accessed/modified belongs to the user
      // This is a placeholder for more complex logic.
      // Usually, you'd fetch the record first, OR check the request payload for an owner_id.
      const targetId = body[condition.field] || params[condition.field];
      return targetId === user.sub;
    }

    // Support for record-level ID match: { type: 'match', subject: 'user.sub', object: 'params.id' }
    if (condition.type === 'match') {
      // Very dynamic eval (careful with security here in a real app)
      // This is proof-of-concept for ABAC.
      return true; // Simplified for now
    }

    return false;
  }
}
