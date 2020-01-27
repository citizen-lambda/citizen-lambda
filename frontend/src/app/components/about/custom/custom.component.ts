import { Component, ViewEncapsulation, Inject, LOCALE_ID } from '@angular/core';
import { IAppConfig } from '../../../core/models';
import { AppConfig } from '../../../../conf/app.config';
import { SeoService } from '../../../services/seo.service';

type AppConfigAbout = Pick<IAppConfig, 'appName'>;

@Component({
  selector: 'app-about-custom',
  templateUrl: '../../../../../../config/custom/frontend/about/custom.component.html',
  styleUrls: ['../../../../../../config/custom/frontend/about/custom.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class AboutCustomComponent {
  readonly appConfig: AppConfigAbout = AppConfig;

  constructor(@Inject(LOCALE_ID) public localeId: string, protected seo: SeoService) {
    this.seo.setTitle(
      `${this.localeId.startsWith('fr') ? 'A Propos' : 'About'}`
    );
  }
}
