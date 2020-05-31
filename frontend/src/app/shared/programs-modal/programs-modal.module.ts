import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

import { NgbModule, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { ProgramsModalComponent } from './programs-modal.component';
import { ProgramsModalRoutingModule } from './programs-modal-routing.module';

@NgModule({
  imports: [RouterModule, CommonModule, NgbModule, ProgramsModalRoutingModule],
  providers: [NgbActiveModal],
  declarations: [ProgramsModalComponent],
  exports: [ProgramsModalComponent]
})
export class ProgramsModalModule {}
