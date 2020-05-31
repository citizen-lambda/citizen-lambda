import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { NgbModule, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { ScrollingModule } from '@angular/cdk/scrolling';

import { ObsFormModule } from './form/obs-form.module';
import { WebshareModule } from '../webshare/webshare.module';
import { ProgramTeaserModule } from '@shared/program-teaser/program-teaser.module';
import { ProgramContentModule } from '@shared/program-content/program-content.module';
import { ObservationDetailsModule } from '@shared/observation-details/observation-details.module';
import { FlowModule } from '@shared/flow/flow.module';
import { ImageTopModule } from '@shared/image-top/image-top.module';

import { ObsListComponent } from './list/list.component';
import { ObsMapComponent } from './map/map.component';
import { MarkerPopupComponent } from './map/marker-popup.component';
import { ModalFlowService } from './modalflow/modalflow.service';
import { ModalFlowComponent } from './modalflow/modalflow.component';
import { OnboardComponent } from './modalflow/steps/onboard/onboard.component';
import { CommittedComponent } from './modalflow/steps/committed/committed.component';
import { CongratsComponent } from './modalflow/steps/congrats/congrats.component';
import { RewardComponent } from './modalflow/steps/reward/reward.component';

@NgModule({
  imports: [
    RouterModule,
    CommonModule,
    ScrollingModule,
    ObsFormModule,
    NgbModule,
    FlowModule,
    WebshareModule,
    ProgramTeaserModule,
    ProgramContentModule,
    ObservationDetailsModule,
    ImageTopModule
  ],
  providers: [NgbActiveModal],
  declarations: [
    OnboardComponent,
    CommittedComponent,
    CongratsComponent,
    ModalFlowComponent,
    RewardComponent,
    ObsListComponent,
    ObsMapComponent,
    MarkerPopupComponent
  ],
  exports: [
    ScrollingModule,
    NgbModule,
    ProgramTeaserModule,
    ProgramContentModule,
    FlowModule,
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
    ImageTopModule,
    ObservationDetailsModule
  ]
})
export class ObservationsSharedModule {
  static forRoot(): ModuleWithProviders<ObservationsSharedModule> {
    return {
      ngModule: ObservationsSharedModule,
      providers: [ModalFlowService]
    };
  }
}
