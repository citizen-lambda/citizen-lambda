import { combineLatest, BehaviorSubject } from 'rxjs';
import { AfterViewInit, HostListener } from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { map, take, filter } from 'rxjs/operators';

export interface IAppConfig {
  appName: string;
  API_ENDPOINT: string;
  // API_TAXHUB: "http://localhost:5000/api",
  URL_APPLICATION: string;
  FRONTEND: {
    PROD_MOD: boolean;
    // MULTILINGUAL: false,
    DISPLAY_FOOTER: boolean;
    DISPLAY_TOPBAR: boolean;
    DISPLAY_SIDEBAR: boolean;
  };
  ALLOWED_EXTENSIONS: string[]; // TODO: validate media (ext?) for obs submission
  REWARDS: true;
  termsOfUse: {
    fr: string;
    en: string;
  };
  // TODO: platform meta description per locales
  platform_intro: {
    fr: string;
    en: string;
  };
  platform_teaser: {
    fr: string;
    en: string;
  };
  platform_participate: {
    fr: string;
    en: string;
  };
  program_share_an_observation: {
    fr: string;
    en: string;
  };
  program_add_an_observation: {
    fr: string;
    en: string;
  };
  taxonSelectInputThreshold: number;
  taxonAutocompleteInputThreshold: number;
  taxonAutocompleteFields: string[];
  program_list_sort: string;
}

// TODO: mv anchorNavigation to directive and handle change detection.
export abstract class AnchorNavigation implements AfterViewInit {
  fragment$ = new BehaviorSubject<string | null>(null);

  constructor(protected router: Router, protected route: ActivatedRoute) {
    combineLatest(
      this.route.fragment.pipe(
        filter(fragment => fragment !== null),
        map(fragment => fragment),
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
    const offset = parseInt(
      // tslint:disable-next-line: no-non-null-assertion
      getComputedStyle(document.documentElement!)
        .getPropertyValue('--narrow-topbar-height')
        .replace('px', '')
        .trim(),
      10
    );
    // console.debug(offset);
    if (anchor) {
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
    // this.fragment$.subscribe((fragment: string) => this.jumpTo(fragment));
  }

  @HostListener('window:scroll', ['$event'])
  scrollHandler(_event: Event) {
    // console.debug("scroll");

    // tslint:disable-next-line: no-non-null-assertion
    if (document.body.scrollTop > 0 || document.documentElement!.scrollTop > 0) {
      // tslint:disable-next-line: no-non-null-assertion
      const tallSize = getComputedStyle(document.documentElement!)
        .getPropertyValue('--tall-topbar-height')
        .trim();
      // tslint:disable-next-line: no-non-null-assertion
      const narrowSize = getComputedStyle(document.documentElement!)
        .getPropertyValue('--narrow-topbar-height')
        .trim();
      // tslint:disable-next-line: no-non-null-assertion
      const offset = getComputedStyle(document.documentElement!)
        .getPropertyValue('--router-outlet-margin-top')
        .trim();
      // tslint:disable-next-line: no-non-null-assertion
      const barsize = parseInt(offset, 10) - document.documentElement!.scrollTop;
      const minSize = parseInt(narrowSize, 10);
      const maxSize = parseInt(tallSize, 10);
      // tslint:disable-next-line: no-non-null-assertion
      document.documentElement!.style.setProperty(
        '--router-outlet-margin-top',
        Math.min(Math.max(barsize, minSize), maxSize) + 'px'
      );
    } else {
      // tslint:disable-next-line: no-non-null-assertion
      document.documentElement!.style.setProperty(
        '--router-outlet-margin-top',
        'var(--tall-topbar-height)'
      );
    }
  }
}
