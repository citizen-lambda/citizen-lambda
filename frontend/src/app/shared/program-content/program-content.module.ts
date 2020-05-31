import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { ProgramContentComponent } from './program-content.component';

@NgModule({
  declarations: [ProgramContentComponent],
  imports: [RouterModule, CommonModule],
  exports: [ProgramContentComponent]
})
export class ProgramContentModule {}
