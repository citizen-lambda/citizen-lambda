import { Component, ViewEncapsulation, ChangeDetectionStrategy, Input } from '@angular/core';
import { AnchorNavigation } from '../../../helpers/anav';
import { Program } from '../../../features/programs/programs.models';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-program-teaser',
  templateUrl: './program-teaser.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProgramTeaserComponent extends AnchorNavigation {
  @Input() program!: Program;

  constructor(protected router: Router, protected route: ActivatedRoute) {
    super(router, route);
  }
}
