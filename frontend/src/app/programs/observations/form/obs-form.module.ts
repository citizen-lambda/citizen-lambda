// tslint:disable: quotemark
import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";

import { NgbModule } from "@ng-bootstrap/ng-bootstrap";

import { ObsFormComponent } from "./form.component";
import { ObsFormMapComponent } from "./obs-form-map-component";

@NgModule({
  declarations: [ObsFormMapComponent, ObsFormComponent],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgbModule],
  exports: [
    ObsFormComponent,
    ObsFormMapComponent,
    NgbModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ],
  entryComponents: [ObsFormComponent, ObsFormMapComponent]
})
export class ObsFormModule {}
