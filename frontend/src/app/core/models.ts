import { Observable, combineLatest, BehaviorSubject } from "rxjs";
import { OnInit, AfterViewInit, HostListener } from "@angular/core";
import { ActivatedRoute, Router, NavigationEnd } from "@angular/router";
import { map, take, filter, tap } from "rxjs/operators";

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

// type Constructor<T = {}> = new (...args: any[]) => T;

// function AnchorNavigation<TBase extends Constructor>(Base: TBase) {
//   return class extends Base implements OnInit {
//     router: Router;
//     route: ActivatedRoute;
//     fragment$ = new BehaviorSubject<string>();
//     constructor(...args: any[]) {
//      super(...args);
export abstract class AnchorNavigation implements AfterViewInit {
  fragment$ = new BehaviorSubject<string | null>(null);

  constructor(protected router: Router, protected route: ActivatedRoute) {
    combineLatest(
      this.router.events.pipe(
        filter(event => event instanceof NavigationEnd),
        take(1)
      ),
      this.route.fragment.pipe(
        filter(fragment => !!fragment),
        map(fragment => fragment),
        take(1)
      )
    )
      .pipe(
        map(([_, fragment]) => {
          console.debug("tapped fragment:", fragment);
          return fragment;
        })
      )
      .subscribe(fragment => this.fragment$.next(fragment));
  }

  jumpTo(fragment: string, delay: number = 200) {
    console.debug("jumpTo", fragment);
    const anchor = document.getElementById(fragment);
    const offset = parseInt(
      getComputedStyle(document.documentElement!)
        .getPropertyValue("--narrow-topbar-height")
        .replace("px", "")
        .trim()
    );
    console.debug(offset);
    if (!!anchor) {
      setTimeout(() => {
        window.scrollTo({
          top: anchor.getBoundingClientRect().top + window.pageYOffset - offset,
          behavior: "smooth"
        });
      }, delay); // FIXME: this seems entirely timely !
    }
  }

  // abstract AfterViewInit(): void;

  ngAfterViewInit() {
    this.fragment$.subscribe((fragment: string) => this.jumpTo(fragment));
  }

  @HostListener("document:scroll", ["$event"])
  scrollHandler(_event: Event) {
    const tallSize = getComputedStyle(document.documentElement!)
      .getPropertyValue("--tall-topbar-height")
      .trim();
    const narrowSize = getComputedStyle(document.documentElement!)
      .getPropertyValue("--narrow-topbar-height")
      .trim();
    const offset = getComputedStyle(document.documentElement!)
      .getPropertyValue("--router-outlet-margin-top")
      .trim();

    if (
      document.body.scrollTop > 0 ||
      document.documentElement!.scrollTop > 0
    ) {
      const barsize = parseInt(offset) - document.documentElement!.scrollTop;
      const minSize = parseInt(narrowSize);
      const maxSize = parseInt(tallSize);
      document.documentElement!.style.setProperty(
        "--router-outlet-margin-top",
        Math.min(Math.max(barsize, minSize), maxSize) + "px"
      );
    } else {
      document.documentElement!.style.setProperty(
        "--router-outlet-margin-top",
        "var(--tall-topbar-height)"
      );
    }
  }
}
