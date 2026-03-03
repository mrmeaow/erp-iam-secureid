import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { RoleModule } from '../role/role.module';
import { UserModule } from '../user/user.module';
import { Invitation } from './entities/invitation.entity';
import { Membership } from './entities/membership.entity';
import { Tenant } from './entities/tenant.entity';
import { InvitationController } from './invitation.controller';
import { InvitationService } from './services/invitation.service';
import { TenantController } from './tenant.controller';
import { TenantService } from './tenant.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tenant, Membership, Invitation]),
    UserModule,
    RoleModule,
    forwardRef(() => AuthModule),
  ],
  controllers: [TenantController, InvitationController],
  providers: [TenantService, InvitationService],
  exports: [TenantService, InvitationService],
})
export class TenantModule {}
