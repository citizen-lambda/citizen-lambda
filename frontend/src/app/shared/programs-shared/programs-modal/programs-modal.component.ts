import { Component, ViewEncapsulation, ChangeDetectionStrategy } from '@angular/core';

import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { ProgramsService } from '@features/programs/programs.service';
import { ProgramsResolve } from '@features/programs/programs-resolve.service';

@Component({
  selector: 'app-programs-modal',
  templateUrl: './programs-modal.component.html',
  styleUrls: ['./programs-modal.component.css'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ProgramsResolve]
})
export class ProgramsModalComponent {
  constructor(public activeModal: NgbActiveModal, public programService: ProgramsService) {}
}
