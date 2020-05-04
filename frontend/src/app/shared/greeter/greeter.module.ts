import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { GreeterComponent } from './greeter.component';

@NgModule({
  imports: [RouterModule, CommonModule],
  declarations: [GreeterComponent],
  entryComponents: [GreeterComponent],
  exports: [GreeterComponent]
})
export class GreeterModule {}
