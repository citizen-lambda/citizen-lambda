import { NgModule } from '@angular/core';
// import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';

import { ProgramsResolve } from '../programs/programs-resolve.service';
import { ObsComponent } from './obs.component';
// tslint:disable-next-line: max-line-length
import { ObservationSharedDetailsComponent } from '../../shared/observations-shared/observation-shared-details/observation-shared-details.component';

const routes: Routes = [
  {
    path: '',
    component: ObsComponent,
    resolve: { programs: ProgramsResolve },
    children: [
      {
        path: 'details/:obsid',
        component: ObservationSharedDetailsComponent,
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ObservationsRoutingModule { }
