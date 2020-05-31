import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ProgramsResolve } from '@services/programs-resolve.service';
import { ObsComponent } from './obs.component';
// tslint:disable-next-line: max-line-length
import { RoutedModalObservationDetailsComponent } from '@shared/observation-details/routed-modal-observation-details-component';
// import { ObservationDetailsModule } from '@shared/observation-details/observation-details.module';

const routes: Routes = [
  {
    path: '',
    component: ObsComponent,
    resolve: { programs: ProgramsResolve },
    children: [
      {
        path: 'details/:obsid',
        component: RoutedModalObservationDetailsComponent
      }
    ]
  }
  /*
  {
    path: 'details/:obsid',
    loadChildren: (): Promise<any> =>
      import('@shared/observation-details/observation-details.module').then(m => m.ObservationDetailsModule)
  }
 */
];

@NgModule({
  imports: [RouterModule.forChild(routes) /* ObservationDetailsModule */],
  exports: [RouterModule]
})
export class ObservationsRoutingModule {}
