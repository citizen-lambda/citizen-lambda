import { AfterViewInit, HostListener, Directive } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest, BehaviorSubject } from 'rxjs';
import { distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { UnsubscribeOnDestroy } from './unsubscribe-on-destroy';

@Directive()
export abstract class AnchorNavigationDirective extends UnsubscribeOnDestroy
  implements AfterViewInit {
  fragment$ = this.route.fragment.pipe(distinctUntilChanged());
  orient$ = new BehaviorSubject<OrientationType>(
    window.screen.orientation.type || 'landscape-primary'
  );

  constructor(protected router: Router, protected route: ActivatedRoute) {
    super();
  }

  @HostListener('window:resize', ['$event'])
  @HostListener('window:orientationchange', ['$event'])
  orientationHandler($event: Event): void {
    let orient: OrientationType = window.screen.orientation.type || 'landscape-primary';
    if ($event.type === 'orientationchange') {
      orient = window.screen.orientation.type;
    }
    if ($event.type === 'resize') {
      orient =
        window.innerHeight > window.innerWidth && orient === 'landscape-primary'
          ? 'portrait-primary'
          : orient;
    }
    this.orient$.next(orient);
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
    combineLatest([this.fragment$, this.orient$.pipe(distinctUntilChanged())])
      .pipe(takeUntil(this.onDestroy$))
      .subscribe(([fragment]) => this.jumpTo(fragment));
  }
}
