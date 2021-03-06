import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProgramsRoutingModule } from './programs-routing.module';
import { ProgramsService } from '@services/programs.service';
import { ProgramsResolve } from '@services/programs-resolve.service';

@NgModule({
  imports: [CommonModule, ProgramsRoutingModule],
  providers: [ProgramsService, ProgramsResolve],
  declarations: [],
  exports: []
})
export class ProgramsModule {}
