import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { HomeRoutingModule } from './home-routing.module';

import { GreeterModule } from '@shared/greeter/greeter.module';
import { ProgramTeaserModule } from '@shared/program-teaser/program-teaser.module';
import { ProgramsModalModule } from '@shared/programs-modal/programs-modal.module';
import { ProgramsCarouselModule } from '@shared/programs-carousel/programs-carousel.module';

import { HomeComponent } from './home.component';
import { HomeCustomComponent } from './custom/custom.component';

@NgModule({
  imports: [
    CommonModule,
    GreeterModule,
    HomeRoutingModule,
    NgbModule,
    ProgramTeaserModule,
    ProgramsModalModule,
    ProgramsCarouselModule
  ],
  declarations: [HomeComponent, HomeCustomComponent]
})
export class HomeModule {}
