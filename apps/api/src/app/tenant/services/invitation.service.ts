import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { Repository } from 'typeorm';
import { MailService } from '../../../shared/modules/mail/mail.service';
import { RoleService } from '../../role/role.service';
import { UserService } from '../../user/user.service';
import { Invitation, InvitationStatus } from '../entities/invitation.entity';
import { TenantService } from '../tenant.service';

@Injectable()
export class InvitationService {
  constructor(
    @InjectRepository(Invitation)
    private readonly invitationRepository: Repository<Invitation>,
    private readonly tenantService: TenantService,
    private readonly userService: UserService,
    private readonly roleService: RoleService,
    private readonly mailService: MailService,
  ) {}

  async createInvitation(data: {
    email: string;
    tenant_id: string;
    role_id: string;
    permissions?: any;
    expires_in_days?: number;
  }): Promise<Invitation> {
    const token = randomBytes(32).toString('hex');
    let expires_at: Date | undefined;

    if (data.expires_in_days) {
      expires_at = new Date();
      expires_at.setDate(expires_at.getDate() + data.expires_in_days);
    }

    const invitation = this.invitationRepository.create({
      email: data.email,
      tenant_id: data.tenant_id,
      role_id: data.role_id,
      permissions: data.permissions,
      token,
      expires_at,
      status: InvitationStatus.PENDING,
    });

    const saved = await this.invitationRepository.save(invitation);

    // Send email (Assuming we have a sendInvitationEmail method in MailService)
    // For now, I'll log it or assume it's there.
    // await this.mailService.sendInvitationEmail({ email: data.email, token, tenantName: ... });

    return saved;
  }

  async findByToken(token: string): Promise<Invitation> {
    const invitation = await this.invitationRepository.findOne({
      where: { token },
      relations: ['tenant', 'role'],
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException(`Invitation is already ${invitation.status}`);
    }

    if (invitation.expires_at && invitation.expires_at < new Date()) {
      invitation.status = InvitationStatus.EXPIRED;
      await this.invitationRepository.save(invitation);
      throw new BadRequestException('Invitation has expired');
    }

    return invitation;
  }

  async acceptInvitation(token: string, userId: string): Promise<void> {
    const invitation = await this.findByToken(token);

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException(`Invitation is already ${invitation.status}`);
    }

    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.email !== invitation.email) {
      throw new BadRequestException('Email mismatch');
    }

    // Create membership
    await this.tenantService.addMember(
      invitation.tenant_id,
      userId,
      invitation.role_id,
      invitation.permissions,
    );

    invitation.status = InvitationStatus.ACCEPTED;
    await this.invitationRepository.save(invitation);
  }

  async declineInvitation(token: string): Promise<void> {
    const invitation = await this.findByToken(token);
    invitation.status = InvitationStatus.DECLINED;
    await this.invitationRepository.save(invitation);
  }
}
