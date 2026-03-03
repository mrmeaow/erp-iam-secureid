import { Directive, Input, TemplateRef, ViewContainerRef, effect, inject } from '@angular/core';
import { AccessControlService } from '../services/access-control.service';

@Directive({
  selector: '[hasPermission]',
  standalone: true,
})
export class HasPermissionDirective {
  private readonly templateRef = inject(TemplateRef);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly accessControl = inject(AccessControlService);

  private resource?: string;
  private action?: string;
  private data?: any;

  @Input('hasPermission') set permission(value: string | [string, string] | [string, string, any]) {
    if (typeof value === 'string') {
      const parts = value.split(':');
      this.resource = parts[0];
      this.action = parts[1];
    } else if (Array.isArray(value)) {
      this.resource = value[0];
      this.action = value[1];
      this.data = value[2];
    }
    this.updateView();
  }

  constructor() {
    // Effect to auto-update view when auth state change
    effect(() => {
      this.updateView();
    });
  }

  private updateView() {
    if (!this.resource || !this.action) {
      this.viewContainer.clear();
      return;
    }

    const hasAccess = this.accessControl.can(this.resource, this.action, this.data);

    if (hasAccess) {
      if (this.viewContainer.length === 0) {
        this.viewContainer.createEmbeddedView(this.templateRef);
      }
    } else {
      this.viewContainer.clear();
    }
  }
}
