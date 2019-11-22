import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HomeRoutingModule } from './home-routing.module';

import { GreeterModule } from '../shared/greeter/greeter.module';

import { HomeComponent } from './home.component';
import { HomeCustomComponent } from './custom/custom.component';

@NgModule({
  imports: [
    CommonModule,
    GreeterModule,
    HomeRoutingModule
  ],
  declarations: [HomeComponent, HomeCustomComponent]
})
export class HomeModule { }
