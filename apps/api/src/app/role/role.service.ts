import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Permission } from '../permission/entities/permission.entity';
import { PermissionService } from '../permission/permission.service';
import { Role } from './entities/role.entity';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    private readonly permissionService: PermissionService,
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

  async findById(role_id: string): Promise<Role | null> {
    return this.roleRepository.findOne({
      where: { role_id },
      relations: ['permissions'],
    });
  }

  async assignPermissions(
    role_id: string,
    permission_ids: string[],
  ): Promise<Role> {
    const role = await this.findById(role_id);
    if (!role) {
      throw new Error('Role not found');
    }

    const permissions = permission_ids.length
      ? await this.permissionRepository.findBy({
          permission_id: In(permission_ids),
        })
      : [];
    role.permissions = permissions;
    return this.roleRepository.save(role);
  }

  async findAllByTenant(tenant_id: string): Promise<Role[]> {
    return this.roleRepository.find({
      where: { tenant_id },
      relations: ['permissions'],
    });
  }

  async ensureDefaultRoles(tenant_id: string): Promise<Role> {
    const allPermissions = await this.permissionService.findAll();

    const createOrGetRole = async (name: string) => {
      const existing = await this.findByNameAndTenant(name, tenant_id);
      if (existing) return existing;

      try {
        const role = this.roleRepository.create({
          tenant_id,
          name,
          permissions: allPermissions,
        });
        return await this.roleRepository.save(role);
      } catch (err) {
        if (err.code === '23505') {
          const reload = await this.findByNameAndTenant(name, tenant_id);
          if (reload) return reload;
        }
        throw err;
      }
    };

    const ownerRole = await createOrGetRole('OWNER');
    await createOrGetRole('ADMIN');

    return ownerRole;
  }
}
