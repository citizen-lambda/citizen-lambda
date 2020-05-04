import {
  Component,
  ViewChild,
  ViewEncapsulation,
  ChangeDetectionStrategy,
  Input,
  Inject,
  LOCALE_ID
} from '@angular/core';
import { NgbCarousel, NgbSlideEvent, NgbSlideEventSource } from '@ng-bootstrap/ng-bootstrap';

import { AppConfig } from '../../../../conf/app.config';
import { AppConfigInterface } from '../../../core/models';
import { Program } from '../../../features/programs/programs.models';

type AppConfigPrograms = Pick<AppConfigInterface, 'platform_participate'>;

@Component({
  selector: 'app-programs',
  templateUrl: 'programs.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProgramsComponent {
  readonly appConfig: AppConfigPrograms = AppConfig;
  LabelPlatformEngage = (this.appConfig.platform_participate as { [lang: string]: string })[
    this.localeId
  ];
  @Input()
  programs!: Program[];
  @ViewChild('carousel', { static: true }) carousel!: NgbCarousel;
  paused = false;
  unpauseOnArrow = false;
  pauseOnIndicator = false;
  pauseOnHover = true;
  wantGridMediaQuery = window.matchMedia('(min-width: 1023.98px)');

  constructor(@Inject(LOCALE_ID) readonly localeId: string) {}
  togglePaused(): void {
    if (this.paused) {
      this.carousel.cycle();
    } else {
      this.carousel.pause();
    }
    this.paused = !this.paused;
  }

  onSlide(slideEvent: NgbSlideEvent): void {
    if (
      this.unpauseOnArrow &&
      slideEvent.paused &&
      (slideEvent.source === NgbSlideEventSource.ARROW_LEFT ||
        slideEvent.source === NgbSlideEventSource.ARROW_RIGHT)
    ) {
      this.togglePaused();
    }
    if (
      this.pauseOnIndicator &&
      !slideEvent.paused &&
      slideEvent.source === NgbSlideEventSource.INDICATOR
    ) {
      this.togglePaused();
    }
  }
}
