import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Membership } from './entities/membership.entity';
import { Tenant } from './entities/tenant.entity';

@Injectable()
export class TenantService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(Membership)
    public readonly membershipRepository: Repository<Membership>,
  ) {}

  async create(name: string): Promise<Tenant> {
    const tenant = this.tenantRepository.create({
      name,
    });
    return this.tenantRepository.save(tenant);
  }

  async createMembership(
    tenant_id: string,
    user_id: string,
    role_id: string,
  ): Promise<Membership> {
    const membership = this.membershipRepository.create({
      tenant_id,
      user_id,
      role_id,
    });
    return this.membershipRepository.save(membership);
  }

  async findByDomainOrId(identifier: string): Promise<Tenant> {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        identifier,
      );

    const tenant = await this.tenantRepository.findOne({
      where: isUuid
        ? [{ tenant_id: identifier }, { domain: identifier }]
        : { domain: identifier },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant '${identifier}' not found`);
    }

    return tenant;
  }

  async getUserMemberships(userId: string): Promise<Membership[]> {
    return this.membershipRepository.find({
      where: { user_id: userId, is_active: true },
      relations: ['tenant', 'role'],
    });
  }

  async getTenantMembers(tenantId: string): Promise<Membership[]> {
    return this.membershipRepository.find({
      where: { tenant_id: tenantId },
      relations: ['user', 'role'],
    });
  }

  async addMember(
    tenantId: string,
    userId: string,
    roleId: string,
    permissions?: any,
  ): Promise<Membership> {
    const existing = await this.membershipRepository.findOne({
      where: { tenant_id: tenantId, user_id: userId },
    });
    if (existing) {
      existing.is_active = true;
      existing.role_id = roleId;
      existing.permissions = permissions;
      return this.membershipRepository.save(existing);
    }

    const membership = this.membershipRepository.create({
      tenant_id: tenantId,
      user_id: userId,
      role_id: roleId,
      permissions,
    });
    return this.membershipRepository.save(membership);
  }

  async removeMember(tenantId: string, userId: string): Promise<void> {
    await this.membershipRepository.delete({
      tenant_id: tenantId,
      user_id: userId,
    });
  }

  async hasActiveMembership(
    tenantId: string,
    userId: string,
  ): Promise<boolean> {
    const membership = await this.membershipRepository.findOne({
      where: {
        tenant_id: tenantId,
        user_id: userId,
        is_active: true,
      },
    });
    return !!membership;
  }
}
