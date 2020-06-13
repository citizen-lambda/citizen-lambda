import { Component, ViewEncapsulation, ChangeDetectionStrategy, Input } from '@angular/core';
import { Subject } from 'rxjs';
import { distinctUntilChanged, map, takeWhile } from 'rxjs/operators';

import { ViewportService } from '@services/viewport.service';

@Component({
  selector: 'app-full-viewport-image',
  templateUrl: './full-viewport-image.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FullViewportImageComponent {
  @Input() image?: HTMLImageElement;
  @Input() alt?: string;
  updatedImgStyle = new Subject<string>();
  show = false;

  constructor(private viewportService: ViewportService) {}

  calcImgStyle(viewportAspectRatio: number): string {
    let result = 'portrait';
    if (this.image) {
      const imgWidth = this.image?.width;
      const imgHeight = this.image?.height;
      const imgAspectRatio = imgWidth / imgHeight;
      result = viewportAspectRatio < imgAspectRatio ? 'landscape' : 'portrait';
    }
    return result;
  }

  toggle(): void {
    this.show = !this.show;

    if (this.show) {
      this.viewportService.viewportAspectRatio
        .pipe(
          takeWhile(() => this.show === true),
          map(ratio => this.calcImgStyle(ratio)),
          distinctUntilChanged()
        )
        .subscribe(klass => this.updatedImgStyle.next(klass));
    }
  }
}
