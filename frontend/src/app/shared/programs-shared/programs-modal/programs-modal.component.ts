import { Component, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';

import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { Program } from '../../../features/programs/programs.models';
import { ProgramsService } from '../../../features/programs/programs.service';
import { ProgramsResolve } from '../../../features/programs/programs-resolve.service';

@Component({
  selector: 'app-programs-modal',
  templateUrl: './programs-modal.component.html',
  styleUrls: ['./programs-modal.component.css'],
  encapsulation: ViewEncapsulation.None,
  providers: [ProgramsResolve]
})
export class ProgramsModalComponent {
  programs$ = new Subject<Program[] | null>();

  constructor(
    private route: ActivatedRoute,
    public activeModal: NgbActiveModal,
    private programService: ProgramsService
  ) {
    this.route.data.subscribe(data => {
      if (data.programs as Program[]) {
        this.programs$.next(data.programs);
      } else {
        this.programService.getAllPrograms().subscribe(programs => this.programs$.next(programs));
      }
    });
  }
}
