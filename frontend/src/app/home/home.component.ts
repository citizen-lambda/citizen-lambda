import { Component, ViewEncapsulation, Inject, LOCALE_ID } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Meta } from '@angular/platform-browser';

import { AppConfig } from '../../conf/app.config';
import { IAppConfig } from '../core/models';
import { Program } from '../programs/programs.models';
import { ProgramsResolve } from '../programs/programs-resolve.service';

type AppConfigHome = Pick<IAppConfig, 'platform_participate'>;

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  encapsulation: ViewEncapsulation.None,
  providers: [ProgramsResolve]
})
export class HomeComponent {
  readonly appConfig: AppConfigHome = AppConfig;
  programs: Program[] = [];

  constructor(
    @Inject(LOCALE_ID) readonly localeId: string,
    protected route: ActivatedRoute,
    protected meta: Meta,
  ) {

    this.route.data.subscribe(data => {
      this.programs = data.programs;
    });

    this.meta.updateTag({
      name: 'description',
      content: 'GeoNature-citizen est une application de sciences participatives à la biodiversité.'
    });
  }
}
