import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ProgramsComponent } from './programs.component';
import { ProgramsResolve } from './programs-resolve.service';

const routes: Routes = [
  {
    path: 'programs',
    component: ProgramsComponent,
    resolve: { programs: ProgramsResolve }
  },
  {
    path: 'programs/:id/observations',
    // loadChildren: () => import('./programs/observations/observations.module').then(m => m.ObservationsModule),
    loadChildren: () => import('../observations/observations.module').then(m => m.ObservationsModule),
    resolve: { programs: ProgramsResolve }
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProgramsRoutingModule { }
