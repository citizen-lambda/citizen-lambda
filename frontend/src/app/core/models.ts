import { Observable } from "rxjs";
import { AfterViewInit, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { map, take } from "rxjs/operators";

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

export abstract class AnchorNavigation implements OnInit, AfterViewInit {
  fragment$: Observable<string>;

  constructor(protected route: ActivatedRoute) {}

  jumpTo(fragment: string) {
    const anchor = document.getElementById(fragment);
    if (!!anchor) {
      setTimeout(() => {
        window.scrollTo({
          top: anchor.getBoundingClientRect().top + window.pageYOffset - 65,
          behavior: "smooth"
        });
      }, 200); // FIXME: this is entirely timely !
    }
  }

  ngOnInit() {
    this.fragment$ = this.route.fragment.pipe(map(fragment => fragment || ""));
  }

  ngAfterViewInit(): void {
    this.fragment$.pipe(take(1)).subscribe(fragment => this.jumpTo(fragment));
    // this.afterViewInit();
  }

  // abstract onInit(): void;
  // abstract afterViewInit(): void;
}
