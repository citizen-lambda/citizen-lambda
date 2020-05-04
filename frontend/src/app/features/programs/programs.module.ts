import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProgramsRoutingModule } from './programs-routing.module';
import { ProgramsService } from './programs.service';
import { ProgramsResolve } from './programs-resolve.service';

@NgModule({
  imports: [CommonModule, ProgramsRoutingModule],
  providers: [ProgramsService, ProgramsResolve],
  declarations: [],
  entryComponents: [],
  exports: []
})
export class ProgramsModule {}
