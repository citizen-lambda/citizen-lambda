import {
  Component,
  OnInit,
  ViewEncapsulation,
  ChangeDetectionStrategy,
  AfterViewInit,
  OnDestroy,
  Input
} from '@angular/core';

import { AnchorNavigation } from '../../../helpers/anav';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, fromEvent } from 'rxjs';
import { throttleTime, map, filter, takeUntil } from 'rxjs/operators';
import { Program } from '../../../features/programs/programs.models';

@Component({
  selector: 'app-program-content',
  templateUrl: './program-content.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProgramContentComponent extends AnchorNavigation
  implements OnInit, AfterViewInit, OnDestroy {
  private unsubscribe$ = new Subject<void>();
  @Input() program!: Program;

  constructor(protected router: Router, protected route: ActivatedRoute) {
    super(router, route);
  }

  ngOnInit() {}

  ngAfterViewInit() {
    // todo: move to directive and make the <p> tag an <article>
    const element: HTMLElement | null = document.querySelector(
      'app-program-content .program-content > article'
    );
    if (element) {
      const scroll$ = fromEvent(element, 'scroll').pipe(
        throttleTime(10),
        map(() =>
          element.offsetHeight + element.scrollTop === element.scrollHeight
            ? 'bottom'
            : element.scrollTop === 0
            ? 'top'
            : null
        ),
        filter(reached => reached !== null),
        takeUntil(this.unsubscribe$)
      );

      const swapClasses = (state: 'top' | 'bottom', e: HTMLElement) => {
        switch (state) {
          case 'bottom':
            e.classList.remove('bottom-edge-shadow');
            e.classList.add('top-edge-shadow');
            break;
          case 'top':
            e.classList.remove('top-edge-shadow');
            e.classList.add('bottom-edge-shadow');
            break;
        }
      };

      scroll$.subscribe(reached => swapClasses(<'top' | 'bottom'>reached, element));
    }
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
