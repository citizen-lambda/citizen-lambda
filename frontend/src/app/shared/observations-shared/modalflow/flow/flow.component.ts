import {
  Component,
  Input,
  OnInit,
  ViewChild,
  ComponentFactoryResolver,
  Output,
  EventEmitter,
  ViewEncapsulation
} from '@angular/core';

import { FlowDirective } from './flow.directive';
import { FlowItem } from './flow-item';
import { FlowComponentInterface } from './flow';

@Component({
  selector: 'app-flow',
  template: ` <ng-template appFlow></ng-template> `,
  styleUrls: ['./flow.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class FlowComponent implements OnInit {
  @Input() flowItems!: FlowItem[];
  @Output() step = new EventEmitter();
  @ViewChild(FlowDirective, { static: true }) flowitem!: FlowDirective;
  currentFlowIndex = -1;

  constructor(private componentFactoryResolver: ComponentFactoryResolver) {}

  ngOnInit(): void {
    this.loadComponent();
  }

  loadComponent(data?: any): void {
    // really, cycle ?
    this.currentFlowIndex = (this.currentFlowIndex + 1) % this.flowItems.length;
    // resolve factory for current flow-item component
    const flowItem = this.flowItems[this.currentFlowIndex];
    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(
      flowItem.component
    );
    // clear app-flow view
    const viewContainerRef = this.flowitem.viewContainerRef;
    viewContainerRef.clear();
    // fill app-flow view with flow-item content
    const componentRef = viewContainerRef.createComponent(componentFactory);
    // have data/state follow
    (componentRef.instance as FlowComponentInterface).data = data || flowItem.data;
    // ding !
    this.step.emit(this.flowItems[this.currentFlowIndex].component.name);
    // tie current flow-item to the next until last ...
    if (
      !(componentRef.instance as FlowComponentInterface).data.next &&
      !(componentRef.instance as FlowComponentInterface).data.final
    ) {
      (componentRef.instance as FlowComponentInterface).data.next = (ctx: any): void => {
        console.debug('FlowComponent.loadComponent:', ctx || flowItem.data);
        this.loadComponent(ctx || flowItem.data);
      };
    }
  }
}
