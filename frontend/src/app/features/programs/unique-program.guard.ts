import { Injectable } from '@angular/core';
import {
  CanActivate,
  CanActivateChild,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { ProgramsService } from '@services/programs.service';
import { Program } from '@models/programs.models';

@Injectable({
  providedIn: 'root'
})
export class UniqueProgramGuard implements CanActivate, CanActivateChild {
  constructor(private programService: ProgramsService, private router: Router) {}

  canActivate(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _next: ActivatedRouteSnapshot,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.programService.programs$.pipe(
      map((programs: Program[] | null) => {
        if (programs?.length === 0) {
          console.error('UniqueProgramGuard: no program found');
          return true;
        }
        if (programs?.length === 1) {
          this.router.navigate(['programs', programs?.[0].id_program, 'observations']);
          return false;
        }
        return true;
      }),
      catchError(error => {
        console.error('UniqueProgramGuard:', error);
        return of(true);
      })
    );
  }

  canActivateChild(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.canActivate(route, state);
  }
}
