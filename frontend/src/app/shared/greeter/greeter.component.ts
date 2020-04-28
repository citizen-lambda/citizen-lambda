import {
  Component,
  OnInit,
  ViewEncapsulation,
  ChangeDetectionStrategy,
  Inject,
  LOCALE_ID,
} from '@angular/core';
import { SafeHtml, DomSanitizer } from '@angular/platform-browser';
import { Router, ActivatedRoute } from '@angular/router';

import { AppConfig } from '../../../conf/app.config';
import { IAppConfig } from '../../core/models';
import { AnchorNavigationDirective } from '../../helpers/anav';

type AppConfigGreeter = Pick<
  IAppConfig,
  'platform_intro' | 'platform_greeter' | 'platform_participate'
>;

@Component({
  selector: 'app-greeter',
  templateUrl: './greeter.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GreeterComponent extends AnchorNavigationDirective implements OnInit {
  readonly AppConfig: AppConfigGreeter = AppConfig;
  platform_greeter: SafeHtml = '';
  platform_intro: SafeHtml = '';

  constructor(
    @Inject(LOCALE_ID) readonly localeId: string,
    protected router: Router,
    protected route: ActivatedRoute,
    protected domSanitizer: DomSanitizer
  ) {
    super(router, route);
  }

  ngOnInit() {
    this.platform_intro = this.domSanitizer.bypassSecurityTrustHtml(
      (AppConfig['platform_intro'] as { [name: string]: string })[this.localeId]
    );
    this.platform_greeter = this.domSanitizer.bypassSecurityTrustHtml(
      (AppConfig['platform_greeter'] as { [name: string]: string })[this.localeId]
    );
  }
}
