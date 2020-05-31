import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { ProgramTeaserComponent } from './program-teaser.component';

@NgModule({
  declarations: [ProgramTeaserComponent],
  imports: [CommonModule, RouterModule],
  exports: [ProgramTeaserComponent]
})
export class ProgramTeaserModule {}
