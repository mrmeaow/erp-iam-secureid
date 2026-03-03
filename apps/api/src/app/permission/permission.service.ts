import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from './entities/permission.entity';

@Injectable()
export class PermissionService implements OnModuleInit {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  async onModuleInit() {
    await this.seedDefaults();
  }

  async findAll(): Promise<Permission[]> {
    return this.permissionRepository.find({ order: { group: 'ASC', label: 'ASC' } });
  }

  async findByResourceAndAction(
    resource: string,
    action: string,
  ): Promise<Permission | null> {
    return this.permissionRepository.findOne({
      where: { resource, action },
    });
  }

  async create(
    resource: string,
    action: string,
    metadata?: Partial<Permission>,
  ): Promise<Permission> {
    const existing = await this.findByResourceAndAction(resource, action);
    if (existing) return existing;

    try {
      const permission = this.permissionRepository.create({
        resource,
        action,
        ...metadata,
      });
      return await this.permissionRepository.save(permission);
    } catch (err) {
      if (err.code === '23505') {
        const reload = await this.findByResourceAndAction(resource, action);
        if (reload) return reload;
      }
      throw err;
    }
  }

  async seedDefaults() {
    const defaults: Array<{
      resource: string;
      action: string;
      label: string;
      group: string;
    }> = [
      {
        resource: 'PRODUCTS',
        action: 'READ',
        label: 'View Products',
        group: 'Production',
      },
      {
        resource: 'PRODUCTS',
        action: 'WRITE',
        label: 'Manage Products',
        group: 'Production',
      },
      { resource: 'USERS', action: 'READ', label: 'View Users', group: 'IAM' },
      { resource: 'USERS', action: 'WRITE', label: 'Manage Users', group: 'IAM' },
      { resource: 'ROLES', action: 'READ', label: 'View Roles', group: 'IAM' },
      { resource: 'ROLES', action: 'WRITE', label: 'Manage Roles', group: 'IAM' },
      {
        resource: 'TENANTS',
        action: 'READ',
        label: 'View Settings',
        group: 'Admin',
      },
      {
        resource: 'TENANTS',
        action: 'WRITE',
        label: 'Manage Org',
        group: 'Admin',
      },
    ];

    for (const d of defaults) {
      const { resource, action, ...metadata } = d;
      await this.create(resource, action, metadata);
    }
  }
}

