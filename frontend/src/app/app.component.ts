import { Component, ViewEncapsulation } from '@angular/core';

import { IAppConfig } from './core/models';
import { AppConfig } from '../conf/app.config';

type AppConfigApp = Pick<IAppConfig, 'FRONTEND' | 'appName'>;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class AppComponent {
  public AppConfig: AppConfigApp = AppConfig;
  title = this.AppConfig.appName;
}
