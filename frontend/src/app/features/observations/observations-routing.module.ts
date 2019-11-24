import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ProgramsResolve } from '../programs/programs-resolve.service';
import { ObsComponent } from './obs.component';

const routes: Routes = [
  {
    path: '',
    component: ObsComponent,
    resolve: { programs: ProgramsResolve }
  },
  // { path: 'debug', component: ObsFormMapComponent },

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ObservationsRoutingModule { }
