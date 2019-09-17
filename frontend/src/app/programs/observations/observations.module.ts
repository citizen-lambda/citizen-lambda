import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollingModule } from '@angular/cdk-experimental/scrolling';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { ObservationsRoutingModule } from './observations-routing.module';

import { ObsFormModule } from './form/obs-form.module';

import { ObsListComponent } from './list/list.component';
import { ObsMapComponent, MarkerPopupComponent } from './map/map.component';
import { ObsComponent } from './obs.component';

import { FlowDirective } from './modalflow/flow/flow.directive';
import { FlowComponent } from './modalflow/flow/flow.component';
import { ModalFlowService } from './modalflow/modalflow.service';
import { ModalFlowComponent } from './modalflow/modalflow.component';
import { OnboardComponent } from './modalflow/steps/onboard/onboard.component';
import { CommittedComponent } from './modalflow/steps/committed/committed.component';
import { CongratsComponent } from './modalflow/steps/congrats/congrats.component';
import { RewardComponent } from './modalflow/steps/reward/reward.component';
import { GreeterModule } from 'src/app/shared/greeter/greeter.module';


@NgModule({
  imports: [
    CommonModule,
    ObservationsRoutingModule,
    ScrollingModule,
    NgbModule,
    ObsFormModule,
    GreeterModule
  ],
  declarations: [
    ObsComponent,
    ObsMapComponent,
    MarkerPopupComponent,
    ObsListComponent,
    FlowComponent,
    FlowDirective,
    OnboardComponent,
    CommittedComponent,
    CongratsComponent,
    ModalFlowComponent,
    RewardComponent,
  ],
  providers: [
    ModalFlowService
  ],
  entryComponents: [
    OnboardComponent,
    CommittedComponent,
    CongratsComponent,
    RewardComponent,
    MarkerPopupComponent,
  ]
})
export class ObservationsModule { }
