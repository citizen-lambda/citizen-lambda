import { AfterViewInit, HostListener, Directive } from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { combineLatest, BehaviorSubject } from 'rxjs';
import { map, take, filter } from 'rxjs/operators';


// TODO: mv anchorNavigation to directive.
@Directive()
export abstract class AnchorNavigation implements AfterViewInit {
  fragment$ = new BehaviorSubject<string>('');

  constructor(protected router: Router, protected route: ActivatedRoute) {
    combineLatest(
      route.fragment.pipe(
        take(1)
      ),
      this.router.events.pipe(
        filter(event => event instanceof NavigationEnd),
        take(1)
      )
    )
      .pipe(
        map(([fragment, _]) => {
          return fragment;
        })
      )
      .subscribe(fragment => this.fragment$.next(fragment));
  }

  jumpTo(fragment: string, delay: number = 200) {
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

  ngAfterViewInit() {
    this.fragment$.pipe(take(1)).subscribe((fragment: string) => this.jumpTo(fragment));
  }

  @HostListener('window:scroll', ['$event'])
  scrollHandler(_event: Event) {
    if (document.body.scrollTop > 0 || document.documentElement.scrollTop > 0) {
      const tallSize = getComputedStyle(document.documentElement)
        .getPropertyValue('--tall-topbar-height')
        .trim();
      const narrowSize = getComputedStyle(document.documentElement)
        .getPropertyValue('--narrow-topbar-height')
        .trim();
      const offset = getComputedStyle(document.documentElement)
        .getPropertyValue('--router-outlet-margin-top')
        .trim();
      const barSize = parseInt(offset, 10) - document.documentElement.scrollTop;
      const minSize = parseInt(narrowSize, 10);
      const maxSize = parseInt(tallSize, 10);
      document.documentElement.style.setProperty(
        '--router-outlet-margin-top',
        Math.min(Math.max(barSize, minSize), maxSize) + 'px'
      );
    } else {
      document.documentElement.style.setProperty(
        '--router-outlet-margin-top',
        'var(--tall-topbar-height)'
      );
    }
  }
}
