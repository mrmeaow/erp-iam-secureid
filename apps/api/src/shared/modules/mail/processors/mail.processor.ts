import { MailerService } from '@nestjs-modules/mailer';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

@Processor('mail')
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name);

  constructor(private readonly mailerService: MailerService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.debug(`Processing email job: ${job.name} (${job.id})`);

    try {
      switch (job.name) {
        case 'welcome':
          await this.mailerService.sendMail({
            to: job.data.to,
            subject: 'Welcome to SECURE.ID!',
            template: './welcome',
            context: {
              name: job.data.name,
              loginUrl: 'http://localhost:4200/auth/login',
            },
          });
          break;

        case 'verify-email':
          await this.mailerService.sendMail({
            to: job.data.to,
            subject: 'Verify your email address',
            template: './verify-email',
            context: {
              token: job.data.token,
              verifyUrl: `http://localhost:4200/auth/verify-email?token=${job.data.token}`,
            },
          });
          break;

        case 'reset-password':
          await this.mailerService.sendMail({
            to: job.data.to,
            subject: 'Reset your password',
            template: './reset-password',
            context: {
              token: job.data.token,
              resetUrl: `http://localhost:4200/auth/reset-password?token=${job.data.token}`,
            },
          });
          break;

        case 'invitation':
          await this.mailerService.sendMail({
            to: job.data.to,
            subject: `Invitation to join ${job.data.tenantName}`,
            template: './invitation',
            context: {
              tenantName: job.data.tenantName,
              inviteUrl: `http://localhost:4200/auth/accept-invite?token=${job.data.token}`,
            },
          });
          break;

        default:
          this.logger.warn(`No handler for email job name: ${job.name}`);
      }
    } catch (err) {
      this.logger.error(
        `Failed to send email ${job.name}: ${err.message}`,
        err.stack,
      );
      throw err;
    }
  }
}
