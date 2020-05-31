import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { RoutedModalObservationDetailsComponent } from './routed-modal-observation-details-component';

const routes: Routes = [
  {
    path: '',
    component: RoutedModalObservationDetailsComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ObservationDetailsRoutingModule {}
