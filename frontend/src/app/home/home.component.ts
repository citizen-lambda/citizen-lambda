import {
  Component,
  OnInit,
  AfterViewInit,
  ViewEncapsulation,
  Inject,
  LOCALE_ID
} from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { Meta, SafeHtml, DomSanitizer } from "@angular/platform-browser";
import { Observable } from "rxjs";
import { take, map } from "rxjs/operators";

import { IAppConfig } from "../core/models";
import { AppConfig } from "../../conf/app.config";
import { ProgramsResolve } from "../programs/programs-resolve.service";
import { Program } from "../programs/programs.models";

type AppConfigHome = Pick<IAppConfig, "platform_intro" | "platform_teaser">;

@Component({
  selector: "app-home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.css"],
  encapsulation: ViewEncapsulation.None,
  providers: [ProgramsResolve]
})
export class HomeComponent implements OnInit, AfterViewInit {
  programs: Program[];
  fragment$: Observable<string>;
  platform_teaser: SafeHtml;
  platform_intro: SafeHtml;
  readonly AppConfig: AppConfigHome = AppConfig;

  constructor(
    @Inject(LOCALE_ID) readonly localeId: string,
    private route: ActivatedRoute,
    private meta: Meta,
    protected domSanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    this.route.data.subscribe((data: { programs: Program[] }) => {
      this.programs = data.programs;
    });

    this.fragment$ = this.route.fragment.pipe(map(fragment => fragment || ""));

    this.meta.updateTag({
      name: "description",
      content:
        "GeoNature-citizen est une application de sciences participatives à la biodiversité."
    });
    this.platform_intro = this.domSanitizer.bypassSecurityTrustHtml(
      AppConfig["platform_intro"][this.localeId]
    );
    this.platform_teaser = this.domSanitizer.bypassSecurityTrustHtml(
      AppConfig["platform_teaser"][this.localeId]
    );
  }

  jumpTo(fragment) {
    const anchor = document.getElementById(fragment);
    if (!!anchor) {
      window.scrollTo({
        top: anchor.getBoundingClientRect().top + window.pageYOffset - 65,
        behavior: "smooth"
      });
    }
  }

  ngAfterViewInit(): void {
    this.fragment$.pipe(take(1)).subscribe(fragment => this.jumpTo(fragment));
  }
}
