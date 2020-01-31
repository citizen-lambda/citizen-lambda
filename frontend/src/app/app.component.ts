import { Component, ViewEncapsulation, Inject, LOCALE_ID, OnInit } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';

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
export class AppComponent implements OnInit {
  public AppConfig: AppConfigApp = AppConfig;

  constructor(
    @Inject(LOCALE_ID) readonly localeId: string,
    protected seo: SeoService,
    private swUpdate: SwUpdate
  ) {
    this.seo.setMetaTag({ name: 'application-name', content: this.AppConfig.appName });
    this.seo.setMetaTag({
      name: 'keywords',
      content: (this.AppConfig.SEO.keywords as { [lang: string]: string })[this.localeId]
    });
    this.seo.setMetaTag({ name: 'author', content: this.AppConfig.SEO.author });
    if (this.AppConfig.SEO['google-site-verification']) {
      this.seo.setMetaTag({
        name: 'google-site-verification',
        content: this.AppConfig.SEO['google-site-verification']
      });
    }
  }

  ngOnInit() {
    if (this.swUpdate.isEnabled) {
      this.swUpdate.available.subscribe(() => {
        if (confirm('New version available. Load new version ?')) {
          window.location.reload();
        }
      });
    }
  }
}
