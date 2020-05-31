/* eslint-disable @typescript-eslint/no-explicit-any */
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ProgramsResolve } from '@services/programs-resolve.service';

const routes: Routes = [
  {
    path: 'programs',
    loadChildren: (): Promise<any> =>
      import('@shared/programs-modal/programs-modal.module').then(m => m.ProgramsModalModule),
    resolve: { programs: ProgramsResolve }
  },
  {
    path: 'programs/:id/observations',
    loadChildren: (): Promise<any> =>
      import('@features/observations/observations.module').then(m => m.ObservationsModule),
    resolve: { programs: ProgramsResolve }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProgramsRoutingModule {}
