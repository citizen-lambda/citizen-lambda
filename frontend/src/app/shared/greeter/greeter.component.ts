import {
  Component,
  OnInit,
  ViewEncapsulation,
  ChangeDetectionStrategy,
  Inject,
  LOCALE_ID
} from '@angular/core';
import { SafeHtml, DomSanitizer } from '@angular/platform-browser';
import { Router, ActivatedRoute } from '@angular/router';

import { AppConfig } from '@conf/app.config';
import { AppConfigInterface } from '@models/app-config.model';
import { AnchorNavigationDirective } from '@helpers/anav';
import { ViewportService } from '@services/viewport.service';

type AppConfigGreeter = Pick<
  AppConfigInterface,
  'platformIntro' | 'platformGreeter' | 'platform_participate'
>;

@Component({
  selector: 'app-greeter',
  templateUrl: './greeter.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GreeterComponent extends AnchorNavigationDirective implements OnInit {
  readonly AppConfig: AppConfigGreeter = AppConfig;
  platformGreeter: SafeHtml = '';
  platformIntro: SafeHtml = '';

  constructor(
    @Inject(LOCALE_ID) readonly localeId: string,

    protected router: Router,
    protected route: ActivatedRoute,
    protected viewportService: ViewportService,
    protected domSanitizer: DomSanitizer
  ) {
    super(router, route, viewportService);
  }

  ngOnInit(): void {
    this.platformIntro = this.domSanitizer.bypassSecurityTrustHtml(
      (AppConfig.platformIntro as { [name: string]: string })[
        this.localeId.startsWith('fr') ? 'fr' : 'en'
      ]
    );
    this.platformGreeter = this.domSanitizer.bypassSecurityTrustHtml(
      (AppConfig.platformGreeter as { [name: string]: string })[
        this.localeId.startsWith('fr') ? 'fr' : 'en'
      ]
    );
  }
}
