import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { AccessControlService } from './access-control.service';

describe('AccessControlService', () => {
  it('grants access for explicit permission without condition', () => {
    TestBed.configureTestingModule({
      providers: [
        AccessControlService,
        {
          provide: AuthService,
          useValue: {
            currentUser: signal({
              sub: 'u-1',
              email: 'u1@test.local',
              tenantId: 't-1',
              isVerified: true,
              roles: ['ADMIN'],
              permissions: [{ resource: 'PRODUCTS', action: 'READ', condition: null }],
            }),
          },
        },
      ],
    });

    const service = TestBed.inject(AccessControlService);
    expect(service.can('PRODUCTS', 'READ')).toBe(true);
    expect(service.can('PRODUCTS', 'WRITE')).toBe(false);
  });

  it('evaluates ownership conditions against record data', () => {
    TestBed.configureTestingModule({
      providers: [
        AccessControlService,
        {
          provide: AuthService,
          useValue: {
            currentUser: signal({
              sub: 'u-2',
              email: 'u2@test.local',
              tenantId: 't-1',
              isVerified: true,
              roles: ['MEMBER'],
              permissions: [
                {
                  resource: 'PRODUCTS',
                  action: 'WRITE',
                  condition: { owner_id: '${user.sub}' },
                },
              ],
            }),
          },
        },
      ],
    });

    const service = TestBed.inject(AccessControlService);
    expect(service.can('PRODUCTS', 'WRITE', { owner_id: 'u-2' })).toBe(true);
    expect(service.can('PRODUCTS', 'WRITE', { owner_id: 'u-3' })).toBe(false);
  });
});
