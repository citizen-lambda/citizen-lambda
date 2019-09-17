import { Directive, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[appFlow]'
})
export class FlowDirective {
  constructor(public viewContainerRef: ViewContainerRef) {}
}
