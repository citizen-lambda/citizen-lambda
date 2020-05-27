import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ProgramsModalComponent } from '@shared/programs-shared/programs-modal/programs-modal.component';
import { ProgramsResolve } from './programs-resolve.service';

const routes: Routes = [
  {
    path: 'programs',
    component: ProgramsModalComponent,
    resolve: { programs: ProgramsResolve }
  },
  {
    path: 'programs/:id/observations',
    loadChildren: (): Promise<any> =>
      import('../observations/observations.module').then(m => m.ObservationsModule),
    resolve: { programs: ProgramsResolve }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProgramsRoutingModule {}
