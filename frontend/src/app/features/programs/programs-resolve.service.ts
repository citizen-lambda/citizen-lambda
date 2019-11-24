import { Injectable } from '@angular/core';
import { Resolve, RouterStateSnapshot, ActivatedRouteSnapshot } from '@angular/router';
import { Observable, of, EMPTY } from 'rxjs';
import { mergeMap, catchError } from 'rxjs/operators';

import { GncProgramsService } from './gnc-programs.service';
import { Program } from './programs.models';

@Injectable({
  providedIn: 'root'
})
export class ProgramsResolve implements Resolve<Program[]> {
  constructor(private programService: GncProgramsService) {}

  resolve(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<Program[]> | Observable<never> {
    console.warn('resolve::getAllPrograms');

    return this.programService.getAllPrograms().pipe(
      catchError(_error => EMPTY),
      mergeMap((programs: Program[]) => (programs ? of(programs) : EMPTY))
    );
  }
}
