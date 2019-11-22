import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NgbModule, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { ProgramsRoutingModule } from './programs-routing.module';
import { ProgramsComponent } from './programs.component';
// import { DescModalComponent } from './desc-modal/desc-modal.component';

@NgModule({
  imports: [
    CommonModule,
    NgbModule,
    ProgramsRoutingModule
  ],
  providers: [
    NgbActiveModal,
  ],
  declarations: [
    ProgramsComponent,
    // DescModalComponent
  ],
  entryComponents: [
    ProgramsComponent,
    // DescModalComponent
  ],
  exports: [
  ]
})
export class ProgramsModule { }
