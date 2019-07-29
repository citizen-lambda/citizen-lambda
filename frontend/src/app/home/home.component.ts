import { Component, ViewEncapsulation, Inject, LOCALE_ID } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { Meta, SafeHtml, DomSanitizer } from "@angular/platform-browser";

import { AppConfig } from "../../conf/app.config";
import { IAppConfig, AnchorNavigation } from "../core/models";
import { Program } from "../programs/programs.models";
import { ProgramsResolve } from "../programs/programs-resolve.service";

type AppConfigHome = Pick<IAppConfig, "platform_intro" | "platform_teaser">;

@Component({
  selector: "app-home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.css"],
  encapsulation: ViewEncapsulation.None,
  providers: [ProgramsResolve]
})
export class HomeComponent extends AnchorNavigation {
  readonly AppConfig: AppConfigHome = AppConfig;
  programs: Program[];
  platform_teaser: SafeHtml;
  platform_intro: SafeHtml;

  constructor(
    @Inject(LOCALE_ID) readonly localeId: string,
    protected route: ActivatedRoute,
    protected meta: Meta,
    protected domSanitizer: DomSanitizer
  ) {
    super(route);

    this.route.data.subscribe((data: { programs: Program[] }) => {
      this.programs = data.programs;
    });

    this.meta.updateTag({
      name: "description",
      content:
        "GeoNature-citizen est une application de sciences participatives à la biodiversité."
    });

    this.platform_intro = this.domSanitizer.bypassSecurityTrustHtml(
      (AppConfig["platform_intro"] as { [name: string]: string })[this.localeId]
    );
    this.platform_teaser = this.domSanitizer.bypassSecurityTrustHtml(
      (AppConfig["platform_teaser"] as { [name: string]: string })[
        this.localeId
      ]
    );
  }
}
