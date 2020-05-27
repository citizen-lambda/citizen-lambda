import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

import { NgbModule, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { ProgramsModalComponent } from './programs-modal/programs-modal.component';
import { ProgramsCarouselComponent } from './programs-carousel/programs-carousel.component';

@NgModule({
  imports: [CommonModule, RouterModule, NgbModule],
  providers: [NgbActiveModal],
  declarations: [ProgramsModalComponent, ProgramsCarouselComponent],
  exports: [ProgramsCarouselComponent, ProgramsModalComponent]
})
export class ProgramsSharedModule {}
