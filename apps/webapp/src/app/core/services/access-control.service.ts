import { computed, inject, Injectable } from '@angular/core';
import { AuthService } from './auth.service';

export interface AccessCheckOptions {
  resource: string;
  action: string;
  data?: any; // For record-level / ABAC checks
}

@Injectable({
  providedIn: 'root',
})
export class AccessControlService {
  private readonly auth = inject(AuthService);

  // Computed signals for roles and permissions
  readonly roles = computed(() => this.auth.currentUser()?.roles || []);
  readonly permissions = computed(() => this.auth.currentUser()?.permissions || []);

  /**
   * Main entry point for access control checks
   */
  can(resource: string, action: string, data?: any): boolean {
    const perms = this.permissions();
    
    // 1. Find explicit permission for this resource/action
    const permission = perms.find(
      (p) => p.resource === resource && p.action === action
    );

    if (!permission) return false;

    // 2. If no condition, access granted
    if (!permission.condition) return true;

    // 3. Evaluate ABAC condition if data is provided
    if (data) {
      return this.evaluateCondition(permission.condition, data);
    }

    // If condition exists but no data provided, we assume limited access 
    // (caller should handle data-dependent checks)
    return true; 
  }

  /**
   * Check if user has a specific role
   */
  hasRole(roleName: string): boolean {
    return this.roles().includes(roleName);
  }

  /**
   * Evaluation logic for record-level ACLs (ABAC)
   */
  private evaluateCondition(condition: any, data: any): boolean {
    const user = this.auth.currentUser();
    if (!user) return false;

    // Simple equality check for owner_id or similar fields
    // This can be expanded for complex rules like { "owner_id": "${user.sub}" }
    for (const [key, value] of Object.entries(condition)) {
      let expectedValue = value;
      
      // Interpolate user properties if value is a string like "${user.sub}"
      if (typeof value === 'string' && value.startsWith('${user.') && value.endsWith('}')) {
        const prop = value.slice(7, -1);
        expectedValue = (user as any)[prop];
      }

      if (data[key] !== expectedValue) {
        return false;
      }
    }

    return true;
  }
}
