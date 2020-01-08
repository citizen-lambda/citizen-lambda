import { Component, ViewEncapsulation, Inject, LOCALE_ID } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { AppConfig } from '../../../conf/app.config';
import { IAppConfig } from '../../core/models';
import { SeoService } from './../../services/seo.service';
import { Program } from '../programs/programs.models';

type AppConfigHome = Pick<IAppConfig, 'SEO' | 'platform_participate'>;

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class HomeComponent {
  readonly appConfig: AppConfigHome = AppConfig;
  LabelPlatformEngage = (this.appConfig.platform_participate as { [lang: string]: string })[
    this.localeId
  ];
  programs: Program[] = [];

  constructor(
    @Inject(LOCALE_ID) readonly localeId: string,
    protected route: ActivatedRoute,
    protected seo: SeoService
  ) {
    this.route.data.subscribe(data => {
      this.programs = data.programs;
    });

    this.seo.setMetaTag({
      name: 'description',
      content: (this.appConfig.SEO.description as { [lang: string]: string })[this.localeId]
    });
    this.seo.setTitle($localize `Home`);
  }
}
