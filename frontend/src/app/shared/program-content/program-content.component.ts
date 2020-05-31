import {
  Component,
  ViewEncapsulation,
  ChangeDetectionStrategy,
  Input,
  OnInit
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, interval, combineLatest } from 'rxjs';
import { map, audit, distinctUntilKeyChanged, tap } from 'rxjs/operators';

import { Program } from '@features/programs/models/programs.models';
import { AnchorNavigationDirective } from '@helpers/anav';
import { ViewportService } from '@services/viewport.service';

type EdgeShadow = 'bottom' | 'top' | 'both';

const swapEdgeShadow = (state: EdgeShadow, e: HTMLElement): void => {
  if (state === 'top') {
    e.classList.remove('both-edge-shadow');
    e.classList.remove('bottom-edge-shadow');
    e.classList.add('top-edge-shadow');
    return;
  }
  if (state === 'bottom') {
    e.classList.remove('both-edge-shadow');
    e.classList.remove('top-edge-shadow');
    e.classList.add('bottom-edge-shadow');
    return;
  }
  if (state === 'both') {
    e.classList.remove('top-edge-shadow');
    e.classList.remove('bottom-edge-shadow');
    e.classList.add('both-edge-shadow');
  }
};

const calcEdgeShadowUpdate = (element: HTMLElement): EdgeShadow =>
  element.offsetHeight + element.scrollTop >= element.scrollHeight - element.scrollHeight * 0.1
    ? 'top'
    : element.scrollTop <= element.scrollHeight * 0.1
    ? 'bottom'
    : 'both';

@Component({
  selector: 'app-program-content',
  templateUrl: './program-content.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProgramContentComponent extends AnchorNavigationDirective implements OnInit {
  @Input() program!: Program;
  scrollableElement$ = new Subject<HTMLElement | null>();
  scrollTrigger$ = new Subject<Event>();

  constructor(
    protected router: Router,
    protected route: ActivatedRoute,
    protected viewportService: ViewportService
  ) {
    super(router, route, viewportService);

    combineLatest([this.scrollableElement$, this.scrollTrigger$.pipe(audit(() => interval(200)))])
      .pipe(
        map(([element]) => {
          const update = element ? calcEdgeShadowUpdate(element) : null;
          return { element, update };
        }),
        distinctUntilKeyChanged('update'),
        tap(({ element, update }) => {
          if (element && update) {
            swapEdgeShadow(update, element);
          }
        })
      )
      .subscribe();
  }

  ngOnInit(): void {
    const element = document.querySelector(
      '#program-content > app-program-content > article'
    ) as HTMLElement;
    if (element) {
      if (element.offsetHeight === element.scrollHeight) {
        // not scrollable
        swapEdgeShadow('both', element);
      }
      this.scrollableElement$.next(element);
    }
  }

  scrollHandler($event: Event): void {
    this.scrollTrigger$.next($event);
  }
}
