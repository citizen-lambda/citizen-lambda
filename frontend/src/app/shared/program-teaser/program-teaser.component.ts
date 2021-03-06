import { Component, ViewEncapsulation, ChangeDetectionStrategy, Input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { ViewportService } from '@services/viewport.service';
import { AnchorNavigationDirective } from '@helpers/anav';
import { Program } from '@models/programs.models';

@Component({
  selector: 'app-program-teaser',
  templateUrl: './program-teaser.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProgramTeaserComponent extends AnchorNavigationDirective {
  @Input() program!: Program;

  constructor(
    protected router: Router,
    protected route: ActivatedRoute,
    protected viewportService: ViewportService
  ) {
    super(router, route, viewportService);
  }
}
