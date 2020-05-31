import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ProgramsModalComponent } from './programs-modal.component';

const routes: Routes = [
  {
    path: '',
    component: ProgramsModalComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProgramsModalRoutingModule {}
