import { Component, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';

import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { Program } from './programs.models';
import { GncProgramsService } from './gnc-programs.service';
import { ProgramsResolve } from './programs-resolve.service';

@Component({
  selector: 'app-programs',
  templateUrl: './programs.component.html',
  styleUrls: ['./programs.component.css'],
  encapsulation: ViewEncapsulation.None,
  providers: [ ProgramsResolve ]
})
export class ProgramsComponent {
  programs$ = new Subject<Program[] | null>();

  constructor(
    private route: ActivatedRoute,
    public activeModal: NgbActiveModal,
    private programService: GncProgramsService
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
