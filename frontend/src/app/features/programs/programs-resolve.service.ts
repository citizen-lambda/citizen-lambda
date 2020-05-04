import { Injectable } from '@angular/core';
import { Resolve, RouterStateSnapshot, ActivatedRouteSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

import { ProgramsService } from './programs.service';
import { Program } from './programs.models';

@Injectable({
  providedIn: 'root'
})
export class ProgramsResolve implements Resolve<Program[]> {
  constructor(private programService: ProgramsService) {}

  resolve(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    route: ActivatedRouteSnapshot,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    state: RouterStateSnapshot
  ): Observable<Program[]> | Observable<never> {
    console.warn('resolve::getAllPrograms');

    return this.programService
      .getAllPrograms()
      .pipe(mergeMap((programs: Program[] | null) => (programs ? of(programs) : of([]))));
  }
}
