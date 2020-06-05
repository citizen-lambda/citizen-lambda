import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { WebshareModule } from '@shared/webshare/webshare.module';
import { ImageTopModule } from '@shared/image-top/image-top.module';

import { ObservationDetailsComponent } from './observation-details.component';
import { RoutedModalObservationDetailsComponent } from './routed-modal-observation-details-component';
import { ObservationDetailsRoutingModule } from './observation-details-routing.module';

@NgModule({
  declarations: [ObservationDetailsComponent, RoutedModalObservationDetailsComponent],
  imports: [
    CommonModule,
    RouterModule,
    NgbModule,
    WebshareModule,
    ImageTopModule,
    ObservationDetailsRoutingModule
  ],
  exports: [ObservationDetailsComponent, RoutedModalObservationDetailsComponent]
})
export class ObservationDetailsModule {}
