import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ProgramsResolve } from '../programs/programs-resolve.service';
import { ObsComponent } from './obs.component';
import { SpeciesComponent } from 'src/app/components/species/species.component';

const routes: Routes = [
  {
    path: '',
    component: ObsComponent,
    resolve: { programs: ProgramsResolve }
  },
  // { path: 'debug', component: ObsFormMapComponent },
  { path: 'debug', component: SpeciesComponent },

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ObservationsRoutingModule { }
