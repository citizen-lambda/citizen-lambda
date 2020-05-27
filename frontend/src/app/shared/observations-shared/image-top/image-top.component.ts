import {
  Component,
  OnInit,
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
export class ImageTopComponent implements OnInit {
  @Input() src?: string | undefined;
  @Input() alt?: string | undefined;
  @ViewChild('img') img?: ElementRef;
  @ViewChild('fullViewPortContainer') fullViewPortContainer?: ElementRef;

  constructor() {}

  ngOnInit(): void {}

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
