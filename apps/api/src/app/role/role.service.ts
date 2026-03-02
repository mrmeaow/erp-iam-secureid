import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async create(tenant_id: string, name: string): Promise<Role> {
    const role = this.roleRepository.create({
      tenant_id,
      name,
    });
    return this.roleRepository.save(role);
  }

  async findByNameAndTenant(
    name: string,
    tenant_id: string,
  ): Promise<Role | null> {
    return this.roleRepository.findOne({
      where: { name, tenant_id },
    });
  }

  async ensureDefaultRoles(tenant_id: string): Promise<Role> {
    let ownerRole = await this.findByNameAndTenant('OWNER', tenant_id);
    if (!ownerRole) {
      ownerRole = await this.create(tenant_id, 'OWNER');
    }

    // Ensure others like ADMIN, MEMBER
    const adminRole = await this.findByNameAndTenant('ADMIN', tenant_id);
    if (!adminRole) {
      await this.create(tenant_id, 'ADMIN');
    }

    return ownerRole;
  }
}
