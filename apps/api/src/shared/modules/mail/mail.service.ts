import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(@InjectQueue('mail') private readonly mailQueue: Queue) {}

  async sendWelcomeEmail(user: { email: string; name?: string }) {
    await this.mailQueue.add('welcome', {
      to: user.email,
      name: user.name || user.email,
    });
    this.logger.debug(`Welcome email job added for ${user.email}`);
  }

  async sendVerificationEmail(user: { email: string; token: string }) {
    await this.mailQueue.add('verify-email', {
      to: user.email,
      token: user.token,
    });
    this.logger.debug(`Verification email job added for ${user.email}`);
  }

  async sendPasswordResetEmail(user: { email: string; token: string }) {
    await this.mailQueue.add('reset-password', {
      to: user.email,
      token: user.token,
    });
    this.logger.debug(`Password reset email job added for ${user.email}`);
  }

  async sendInvitationEmail(data: {
    email: string;
    token: string;
    tenantName: string;
  }) {
    await this.mailQueue.add('invitation', {
      to: data.email,
      token: data.token,
      tenantName: data.tenantName,
    });
    this.logger.debug(`Invitation email job added for ${data.email}`);
  }
}
