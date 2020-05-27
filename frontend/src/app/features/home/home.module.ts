import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { HomeRoutingModule } from './home-routing.module';

import { GreeterModule } from '@shared/greeter/greeter.module';
import { ProgramsSharedModule } from '@shared/programs-shared/programs-shared.module';

import { HomeComponent } from './home.component';
import { HomeCustomComponent } from './custom/custom.component';

@NgModule({
  imports: [CommonModule, GreeterModule, HomeRoutingModule, NgbModule, ProgramsSharedModule],
  declarations: [HomeComponent, HomeCustomComponent]
})
export class HomeModule {}
