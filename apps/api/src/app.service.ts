import { Injectable } from '@nestjs/common';
import { Logger } from 'nestjs-pino';

@Injectable()
export class AppService {

  constructor (private readonly logger: Logger) {}

  getHello(): string {
    this.logger.log('getHello called from AppService');
    this.logger.log('DEBUG => \n' + JSON.stringify({ foo: 'bar' }, null, 2))
    return 'Hello World!';
  }
}
