import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

import { NgbModule, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { ProgramsCarouselComponent } from './programs-carousel.component';

@NgModule({
  imports: [CommonModule, RouterModule, NgbModule],
  providers: [NgbActiveModal],
  declarations: [ProgramsCarouselComponent],
  exports: [ProgramsCarouselComponent]
})
export class ProgramsCarouselModule {}
