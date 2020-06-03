import {
  Component,
  ViewEncapsulation,
  ChangeDetectionStrategy,
  ViewChild,
  ElementRef,
  Input
} from '@angular/core';

import { FullViewportImageComponent } from '@shared/full-viewport-image/full-viewport-image.component';

@Component({
  selector: 'app-image-top',
  templateUrl: './image-top.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImageTopComponent {
  @Input() src?: string | undefined;
  @Input() alt?: string | undefined;
  @Input() imgMaxHeight?: string;
  @ViewChild('img') img?: ElementRef<HTMLImageElement>;
  @ViewChild('fullViewportImage') fullViewportImage!: FullViewportImageComponent;

  fullViewPortToggle(): void {
    this.fullViewportImage.toggle();
  }
}
