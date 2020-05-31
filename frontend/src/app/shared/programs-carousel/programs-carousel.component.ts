/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  Component,
  ViewChild,
  ViewEncapsulation,
  ChangeDetectionStrategy,
  Input,
  Inject,
  LOCALE_ID
} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { NgbCarousel, NgbSlideEvent, NgbSlideEventSource } from '@ng-bootstrap/ng-bootstrap';

import { AppConfig } from '@conf/app.config';
import { AppConfigInterface } from '@models/app-config.model';
import { ViewportService } from '@services/viewport.service';
import { AnchorNavigationDirective } from '@helpers/anav';
import { Program } from '@models/programs.models';
import { BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

type AppConfigPrograms = Pick<
  AppConfigInterface,
  'platform_participate' | 'programsMasonryThreshold'
>;

const programsMasonryMediaQuery = '(min-width: 1023.98px)';

@Component({
  selector: 'app-programs-carousel',
  templateUrl: 'programs-carousel.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProgramsCarouselComponent extends AnchorNavigationDirective {
  @Input() programs: Program[] = [];
  @ViewChild('carousel', { static: true }) carousel!: NgbCarousel;

  readonly appConfig: AppConfigPrograms = AppConfig;
  LabelPlatformEngage = (this.appConfig.platform_participate as { [lang: string]: string })[
    this.localeId
  ];
  paused = false;
  unpauseOnArrow = false;
  pauseOnIndicator = false;
  pauseOnHover = true;
  wantGridMediaQuery = new BehaviorSubject<boolean>(
    window.matchMedia(programsMasonryMediaQuery).matches
  );

  constructor(
    @Inject(LOCALE_ID) readonly localeId: string,
    protected router: Router,
    protected route: ActivatedRoute,
    protected viewportService: ViewportService
  ) {
    super(router, route, viewportService);
    this.viewportService.viewportWidth
      .pipe(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        tap(_ => {
          this.wantGridMediaQuery.next(window.matchMedia(programsMasonryMediaQuery).matches);
        })
      )
      .subscribe();
  }

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
