import { VersioningType } from '@nestjs/common';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from './../src/app.module';
import { PermissionService } from './../src/app/permission/permission.service';
import { truncateTables } from './utils';

/**
 * Management E2E Test
 * Verifies Role management, Permission listing, and Tenant Member management.
 */
describe('Management (e2e)', () => {
  let app: NestFastifyApplication;
  let dataSource: DataSource;

  let ownerToken: string;
  let adminRoleId: string;
  let newRoleId: string;
  let testUserId: string;

  const ownerData = {
    email: 'owner-mgmt@test.local',
    password: 'password123',
    name: 'Owner',
    companyName: 'Mgmt Corp',
  };
  const memberData = {
    email: 'member-mgmt@test.local',
    password: 'password123',
    name: 'Member',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    dataSource = moduleFixture.get(DataSource);
    const permissionService = moduleFixture.get(PermissionService);

    await truncateTables(dataSource);
    await permissionService.seedDefaults();

    // 1. Register Owner
    const resOwner = await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send(ownerData);
    ownerToken = resOwner.body.data.accessToken;

    // 2. Register a standalone user to be invited later
    const resReg = await request(app.getHttpServer())
      .post('/v1/auth/register-user')
      .send(memberData);
    const tempToken = resReg.body.data.accessToken;

    const resMe = await request(app.getHttpServer())
      .get('/v1/auth/me')
      .set('Authorization', `Bearer ${tempToken}`);
    testUserId = resMe.body.data.sub;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Permission Management', () => {
    it('GET /v1/permissions: should return all available permissions', async () => {
      const res = await request(app.getHttpServer())
        .get('/v1/permissions')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0]).toHaveProperty('resource');
      expect(res.body.data[0]).toHaveProperty('action');
    });

    it('GET /v1/permissions: should be denied for unauthenticated', async () => {
      await request(app.getHttpServer()).get('/v1/permissions').expect(401);
    });
  });

  describe('Role Management', () => {
    it('GET /v1/roles: should return default roles (OWNER, ADMIN)', async () => {
      const res = await request(app.getHttpServer())
        .get('/v1/roles')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      const roles = res.body.data;
      expect(roles.some((r: any) => r.name === 'OWNER')).toBe(true);
      expect(roles.some((r: any) => r.name === 'ADMIN')).toBe(true);

      const adminRole = roles.find((r: any) => r.name === 'ADMIN');
      adminRoleId = adminRole.role_id;
    });

    it('POST /v1/roles: should create a new custom role', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/roles')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: 'MANAGER' })
        .expect(201);

      expect(res.body.data.name).toBe('MANAGER');
      newRoleId = res.body.data.role_id;
    });

    it('POST /v1/roles/:id/permissions: should assign permissions to role', async () => {
      // Get some permission IDs
      const permsRes = await request(app.getHttpServer())
        .get('/v1/permissions')
        .set('Authorization', `Bearer ${ownerToken}`);

      const permIds = permsRes.body.data
        .slice(0, 2)
        .map((p: any) => p.permission_id);

      const res = await request(app.getHttpServer())
        .post(`/v1/roles/${newRoleId}/permissions`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ permission_ids: permIds })
        .expect(201);

      expect(res.body.data.permissions.length).toBe(2);
    });
  });

  describe('Tenant Member Management', () => {
    it('GET /v1/tenants/members/list: should list initial members (owner only)', async () => {
      const res = await request(app.getHttpServer())
        .get('/v1/tenants/members/list')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].user.email).toBe(ownerData.email);
    });

    it('POST /v1/tenants/members: should add a member to the tenant', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/tenants/members')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          user_id: testUserId,
          role_id: adminRoleId,
        })
        .expect(201);

      expect(res.body.data.user_id).toBe(testUserId);
      expect(res.body.data.role_id).toBe(adminRoleId);
    });

    it('GET /v1/tenants/members/list: should now show two members', async () => {
      const res = await request(app.getHttpServer())
        .get('/v1/tenants/members/list')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(res.body.data.length).toBe(2);
    });

    it('POST /v1/tenants/members/:userId/permissions: should update member direct permissions', async () => {
      const customPerms = [
        { resource: 'PRODUCTS', action: 'READ', condition: null },
      ];

      const res = await request(app.getHttpServer())
        .post(`/v1/tenants/members/${testUserId}/permissions`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ permissions: customPerms })
        .expect(201);

      expect(res.body.data.permissions).toEqual(customPerms);
    });

    it('DELETE /v1/tenants/members/:userId: should remove a member', async () => {
      await request(app.getHttpServer())
        .delete(`/v1/tenants/members/${testUserId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      const res = await request(app.getHttpServer())
        .get('/v1/tenants/members/list')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.body.data.length).toBe(1);
    });
  });
});
