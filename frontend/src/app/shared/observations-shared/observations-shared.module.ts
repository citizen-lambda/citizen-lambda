import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// WARNING: cdk-virtual-scroll-viewport rx scheduler calls requestAnimationFrame
// our ssr will log the resulting error, fixed in 8.2.0
// see https://github.com/angular/components/commit/4ff1c95ae7e7901ac6b954ad4813db8d71aa5224
import { ScrollingModule } from '@angular/cdk-experimental/scrolling';

import { ObsFormModule } from './form/obs-form.module';

import { ProgramContentComponent } from './program-content/program-content.component';
import { ProgramTeaserComponent } from './program-teaser/program-teaser.component';
import { ObsListComponent } from './list/list.component';
import { ObsMapComponent } from './map/map.component';
import { MarkerPopupComponent } from './map/MarkerPopupComponent';
import { ModalFlowService } from './modalflow/modalflow.service';
import { FlowDirective } from './modalflow/flow/flow.directive';
import { FlowComponent } from './modalflow/flow/flow.component';
import { FlowService } from './modalflow/flow/flow.service';
import { ModalFlowComponent } from './modalflow/modalflow.component';
import { OnboardComponent } from './modalflow/steps/onboard/onboard.component';
import { CommittedComponent } from './modalflow/steps/committed/committed.component';
import { CongratsComponent } from './modalflow/steps/congrats/congrats.component';
import { RewardComponent } from './modalflow/steps/reward/reward.component';

@NgModule({
  imports: [CommonModule, RouterModule, ScrollingModule, ObsFormModule],
  declarations: [
    ProgramTeaserComponent,
    ProgramContentComponent,
    FlowComponent,
    FlowDirective,
    OnboardComponent,
    CommittedComponent,
    CongratsComponent,
    ModalFlowComponent,
    RewardComponent,
    ObsListComponent,
    ObsMapComponent,
    MarkerPopupComponent
  ],
  providers: [FlowService, ModalFlowService],
  entryComponents: [
    ProgramTeaserComponent,
    ProgramContentComponent,
    FlowComponent,
    ModalFlowComponent,
    OnboardComponent,
    CommittedComponent,
    CongratsComponent,
    RewardComponent,
    ObsMapComponent,
    ObsListComponent,
    MarkerPopupComponent
  ],
  exports: [
    ProgramTeaserComponent,
    ProgramContentComponent,
    FlowDirective,
    FlowComponent,
    ModalFlowComponent,
    ObsFormModule,
    ObsMapComponent,
    ObsListComponent,
    OnboardComponent,
    CommittedComponent,
    CongratsComponent,
    RewardComponent,
    ObsMapComponent,
    ObsListComponent,
    MarkerPopupComponent,
    ScrollingModule
  ]
})
export class ObservationsSharedModule {}
