import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { ScrollingModule } from '@angular/cdk/scrolling';

import { ObsFormModule } from './form/obs-form.module';
import { WebshareModule } from '../webshare/webshare.module';

import { ProgramContentComponent } from '../programs-shared/program-content/program-content.component';
import { ProgramTeaserComponent } from '../programs-shared/program-teaser/program-teaser.component';
import { ObsListComponent } from './list/list.component';
import { ObsMapComponent } from './map/map.component';
import { MarkerPopupComponent } from './map/marker-popup.component';
import { ModalFlowService } from './modalflow/modalflow.service';
import { FlowDirective } from './modalflow/flow/flow.directive';
import { FlowComponent } from './modalflow/flow/flow.component';
import { FlowService } from './modalflow/flow/flow.service';
import { ModalFlowComponent } from './modalflow/modalflow.component';
import { OnboardComponent } from './modalflow/steps/onboard/onboard.component';
import { CommittedComponent } from './modalflow/steps/committed/committed.component';
import { CongratsComponent } from './modalflow/steps/congrats/congrats.component';
import { RewardComponent } from './modalflow/steps/reward/reward.component';
import {
  ObservationDetailsComponent,
  ObsDetailsModalContentComponent
} from './observation-details/observation-details.component';
import { ImageTopComponent } from './image-top/image-top.component';

@NgModule({
  imports: [RouterModule, CommonModule, ScrollingModule, ObsFormModule, NgbModule, WebshareModule],
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
    MarkerPopupComponent,
    ObsDetailsModalContentComponent,
    ObservationDetailsComponent,
    ImageTopComponent
  ],
  exports: [
    NgbModule,
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
    ScrollingModule,
    ObservationDetailsComponent,
    ImageTopComponent
  ]
})
export class ObservationsSharedModule {
  static forRoot(): ModuleWithProviders<ObservationsSharedModule> {
    return {
      ngModule: ObservationsSharedModule,
      providers: [FlowService, ModalFlowService]
    };
  }
}
