import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebshareComponent } from './webshare.component';


@NgModule({
  declarations: [WebshareComponent],
  imports: [
    CommonModule
  ],
  exports: [WebshareComponent]
})
export class WebshareModule { }
