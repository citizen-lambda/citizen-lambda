import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FlowDirective } from './flow.directive';
import { FlowComponent } from './flow.component';
import { FlowService } from './flow.service';

@NgModule({
  imports: [CommonModule],
  declarations: [FlowComponent, FlowDirective],
  exports: [FlowDirective, FlowComponent],
  providers: [FlowService]
})
export class FlowModule {}
