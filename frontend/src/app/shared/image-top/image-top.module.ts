import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ImageTopComponent } from './image-top.component';
import { FullViewportImageModule } from '@shared/full-viewport-image/full-viewport-image.module';

@NgModule({
  declarations: [ImageTopComponent],
  imports: [CommonModule, FullViewportImageModule],
  exports: [ImageTopComponent]
})
export class ImageTopModule {}
