import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
// WARNING: cdk-virtual-scrroll-viewport rx scheduler calls requestAnimationFrame
// our ssr will log the resulting error, fixed in 8.2.0
// see https://github.com/angular/components/commit/4ff1c95ae7e7901ac6b954ad4813db8d71aa5224
import { ScrollingModule } from '@angular/cdk-experimental/scrolling';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { ObservationsRoutingModule } from './observations-routing.module';

import { GreeterModule } from '../../shared/greeter/greeter.module';
import { ObsFormModule } from './form/obs-form.module';

import { ObsListComponent } from './list/list.component';
import { ObsMapComponent, MarkerPopupComponent } from './map/map.component';
import { ObsComponent } from './obs.component';

import { ProgramTeaserComponent } from './program-teaser/program-teaser.component';

import { FlowDirective } from './modalflow/flow/flow.directive';
import { FlowComponent } from './modalflow/flow/flow.component';
import { ModalFlowService } from './modalflow/modalflow.service';
import { ModalFlowComponent } from './modalflow/modalflow.component';
import { OnboardComponent } from './modalflow/steps/onboard/onboard.component';
import { CommittedComponent } from './modalflow/steps/committed/committed.component';
import { CongratsComponent } from './modalflow/steps/congrats/congrats.component';
import { RewardComponent } from './modalflow/steps/reward/reward.component';

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
    ProgramTeaserComponent
  ],
  providers: [ModalFlowService],
  entryComponents: [
    OnboardComponent,
    CommittedComponent,
    CongratsComponent,
    RewardComponent,
    MarkerPopupComponent
  ],
  exports: [ProgramTeaserComponent]
})
export class ObservationsModule {}
