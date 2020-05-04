import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

import { NgbModule, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { ProgramsModalComponent } from './programs-modal/programs-modal.component';
import { ProgramsComponent } from './programs.component/programs.component';

@NgModule({
  imports: [CommonModule, RouterModule, NgbModule],
  providers: [NgbActiveModal],
  declarations: [ProgramsModalComponent, ProgramsComponent],
  entryComponents: [ProgramsModalComponent, ProgramsComponent],
  exports: [ProgramsComponent, ProgramsModalComponent]
})
export class ProgramsSharedModule {}
