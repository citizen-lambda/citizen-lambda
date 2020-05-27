// import { TaxonAutoCompleteInputComponent } from './taxon-input-auto-complete/taxon-auto-complete-input.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { ObsFormComponent } from './form.component';
import { FormMapComponent } from './map/map-component';
import { CommentComponent } from './comment/comment.component';
import { DateComponent } from './date/date.component';
import { PhotoComponent } from './photo/photo.component';
import { TaxonPickerComponent } from './taxon-picker/taxon-picker.component';

@NgModule({
  declarations: [
    FormMapComponent,
    ObsFormComponent,
    CommentComponent,
    DateComponent,
    PhotoComponent,
    TaxonPickerComponent
  ],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgbModule],
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgbModule,
    ObsFormComponent,
    CommentComponent,
    FormMapComponent,
    DateComponent,
    PhotoComponent,
    TaxonPickerComponent
  ]
})
export class ObsFormModule {}
