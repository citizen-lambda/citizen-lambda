import { Component, ViewEncapsulation, Inject, LOCALE_ID } from '@angular/core';

import { IAppConfig } from './core/models';
import { AppConfig } from '../conf/app.config';
import { SeoService } from './services/seo.service';

type AppConfigApp = Pick<IAppConfig, 'FRONTEND' | 'appName' | 'SEO'>;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class AppComponent {
  public AppConfig: AppConfigApp = AppConfig;

  constructor(@Inject(LOCALE_ID) readonly localeId: string, protected seo: SeoService) {
    this.seo.setMetaTag({ name: 'application-name', content: this.AppConfig.appName });
    this.seo.setMetaTag({ name: 'keywords', content: (this.AppConfig.SEO.keywords as { [lang: string]: string })[this.localeId] });
    this.seo.setMetaTag({ name: 'author', content: (this.AppConfig.SEO.author)});
  }
}
