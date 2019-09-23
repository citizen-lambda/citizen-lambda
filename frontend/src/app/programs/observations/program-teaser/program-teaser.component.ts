import { Component, ViewEncapsulation, ChangeDetectionStrategy, AfterViewInit, Input } from '@angular/core';
import { AnchorNavigation } from 'src/app/core/models';
import { Subject } from 'rxjs';
import { Program } from '../../programs.models';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-program-teaser',
  templateUrl: './program-teaser.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProgramTeaserComponent extends AnchorNavigation  implements AfterViewInit {

  @Input() program!: Program;

  constructor(
    protected router: Router,
    protected route: ActivatedRoute
  ) {
    super(router, route);
  }
}
