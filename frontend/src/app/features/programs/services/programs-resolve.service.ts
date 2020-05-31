import { Injectable } from '@angular/core';
import { Resolve, RouterStateSnapshot, ActivatedRouteSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { mergeMap, tap } from 'rxjs/operators';

import { ProgramsService } from '@services/programs.service';
import { Program } from '@models/programs.models';

@Injectable({
  providedIn: 'root'
})
export class ProgramsResolve implements Resolve<Program[]> {
  constructor(private programService: ProgramsService) {}

  resolve(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _route: ActivatedRouteSnapshot,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _state: RouterStateSnapshot
  ): Observable<Program[] | never[]> {
    return this.programService.programs$.pipe(
      mergeMap((programs: Program[] | null) => (programs ? of(programs) : of([]))),
      tap(programs => {
        if (programs?.length === 0) {
          console.error('ProgramsResolve: no program found');
        }
      })
    );
  }
}
