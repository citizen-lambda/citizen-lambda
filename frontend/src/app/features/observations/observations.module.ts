import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { ObservationsRoutingModule } from './observations-routing.module';

import { GreeterModule } from '../../shared/greeter/greeter.module';
import { ObservationsSharedModule } from '../../shared/observations-shared/observations-shared.module';
import { ObsComponent, ObservationsFacade } from './obs.component';

@NgModule({
  imports: [
    CommonModule,
    NgbModule,
    ObservationsRoutingModule,
    ObservationsSharedModule.forRoot(),
    GreeterModule
  ],
  declarations: [ObsComponent],
  providers: [
    ObservationsFacade
  ]
})
export class ObservationsModule {}
