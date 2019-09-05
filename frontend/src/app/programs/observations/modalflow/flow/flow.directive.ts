import { Directive, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[appUserFlow]'
})
export class FlowDirective {
  constructor(public viewContainerRef: ViewContainerRef) {}
}
