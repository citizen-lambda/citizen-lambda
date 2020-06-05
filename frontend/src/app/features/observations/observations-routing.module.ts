import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ProgramsResolve } from '@services/programs-resolve.service';
import { ObsComponent } from './obs.component';
import { RoutedModalObservationDetailsComponent } from '@shared/observation-details/routed-modal-observation-details-component';

const routes: Routes = [
  {
    path: '',
    component: ObsComponent,
    resolve: { programs: ProgramsResolve },
    children: [
      {
        path: 'details/:id',
        component: RoutedModalObservationDetailsComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ObservationsRoutingModule {}
