import {
  Component,
  ViewEncapsulation,
  ChangeDetectionStrategy,
  ViewChild,
  ElementRef,
  Input
} from '@angular/core';

@Component({
  selector: 'app-image-top',
  templateUrl: './image-top.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImageTopComponent {
  @Input() src?: string | undefined;
  @Input() alt?: string | undefined;
  @Input() imgMaxHeight?: string; // = '100%';
  @ViewChild('img') img?: ElementRef<HTMLImageElement>;
  @ViewChild('fullViewPortContainer') fullViewPortContainer?: ElementRef;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  calcStyle(): { [klass: string]: any } {
    let result = {};
    if (this.img) {
      const imgWidth = this.img?.nativeElement.width;
      const imgHeight = this.img?.nativeElement.height;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const imgAspectRatio = imgWidth / imgHeight;
      const screenAspectRatio = viewportWidth / viewportHeight;
      // result = screenAspectRatio < imgAspectRatio ? { 'width.vw': 100 } : { 'height.vh': 100 };
      result = screenAspectRatio < imgAspectRatio ? 'landscape' : 'portrait';
    }
    return result;
  }

  fullViewPortToggle(): void {
    if (
      this.fullViewPortContainer?.nativeElement.classList.value.includes('full-viewport-hidden')
    ) {
      this.fullViewPortContainer?.nativeElement.classList.remove('full-viewport-hidden');
      this.fullViewPortContainer?.nativeElement.classList.add('full-viewport-show');
    } else {
      this.fullViewPortContainer?.nativeElement.classList.remove('full-viewport-show');
      this.fullViewPortContainer?.nativeElement.classList.add('full-viewport-hidden');
    }
  }
}
