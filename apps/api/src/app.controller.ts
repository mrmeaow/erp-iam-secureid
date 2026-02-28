import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { AppService } from './app.service';

@Controller({ version: VERSION_NEUTRAL })
export class AppController {
  constructor(private readonly appService: AppService,
    private readonly logger: Logger
  ) {}

  @Get()
  getHello(): string {
    this.logger.log('getHello called from AppController');
    return this.appService.getHello();
  }
}
