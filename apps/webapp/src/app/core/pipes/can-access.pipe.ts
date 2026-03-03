import { inject, Pipe, PipeTransform } from '@angular/core';
import { AccessControlService } from '../services/access-control.service';

@Pipe({
  name: 'canAccess',
  standalone: true,
})
export class CanAccessPipe implements PipeTransform {
  private readonly accessControl = inject(AccessControlService);

  transform(resource: string, action: string, data?: any): boolean {
    return this.accessControl.can(resource, action, data);
  }
}
