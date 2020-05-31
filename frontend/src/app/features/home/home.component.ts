import { Component, ViewEncapsulation, Inject, LOCALE_ID } from '@angular/core';
import { ActivatedRoute, Data } from '@angular/router';
import { pluck } from 'rxjs/operators';

import { AppConfig } from '@conf/app.config';
import { AppConfigInterface } from '@models/app-config.model';
import { SeoService } from '@services/seo.service';
import { Program } from '@models/programs.models';

type AppConfigHome = Pick<AppConfigInterface, 'appName' | 'SEO'>;

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  encapsulation: ViewEncapsulation.None
})
export class HomeComponent {
  readonly appConfig: AppConfigHome = AppConfig;
  programs$ = this.route.data.pipe(pluck<Data, Program[]>('programs'));

  constructor(
    @Inject(LOCALE_ID) readonly localeId: string,
    protected route: ActivatedRoute,
    protected seo: SeoService
  ) {
    this.seo.setMetaTag({
      name: 'description',
      content: (this.appConfig.SEO.description as { [lang: string]: string })[this.localeId]
    });
    this.seo.setTitle(`${this.localeId.startsWith('fr') ? 'Acceuil' : 'Home'}`);
  }
}
