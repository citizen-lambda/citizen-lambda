import { AfterViewInit, Directive } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest } from 'rxjs';
import { distinctUntilChanged, takeUntil } from 'rxjs/operators';

import { UnsubscribeOnDestroy } from './unsubscribe-on-destroy';
import { ViewportService } from '@services/viewport.service';

@Directive()
export abstract class AnchorNavigationDirective extends UnsubscribeOnDestroy
  implements AfterViewInit {
  fragment$ = this.route.fragment.pipe(distinctUntilChanged());
  orient$ = this.viewportService.orientation;

  constructor(
    protected router: Router,
    protected route: ActivatedRoute,
    protected viewportService: ViewportService
  ) {
    super();
  }

  jumpTo(fragment: string, delay: number = 200): void {
    const anchor = document.getElementById(fragment);
    if (anchor) {
      const offset = parseInt(
        getComputedStyle(document.documentElement)
          .getPropertyValue('--narrow-topbar-height')
          .replace('px', '')
          .trim(),
        10
      );
      setTimeout(() => {
        window.scrollTo({
          top: anchor.getBoundingClientRect().top + window.pageYOffset - offset,
          behavior: 'smooth'
        });
      }, delay);
    }
  }

  // abstract AfterViewInit(): void;
  ngAfterViewInit(): void {
    combineLatest([this.fragment$, this.orient$])
      .pipe(takeUntil(this.onDestroy$))
      .subscribe(([fragment]) => this.jumpTo(fragment));
  }
}
