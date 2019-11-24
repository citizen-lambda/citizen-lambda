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

import { GncProgramsService } from './gnc-programs.service';
import { Program } from './programs.models';

@Injectable({
  providedIn: 'root'
})
export class UniqueProgramGuard implements CanActivate, CanActivateChild {
  constructor(private programService: GncProgramsService, private router: Router) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    // console.warn("UniqueProgramGuard::getAllPrograms");

    return this.programService.getAllPrograms().pipe(
      map((programs: Program[]) => {
        const count = programs ? programs.length : 0;
        if (!!programs && count === 1) {
          this.router.navigate([
            'programs',
            // tslint:disable-next-line: no-non-null-assertion
            programs![0].id_program,
            'observations'
          ]);
          return false;
        }
        return true;
      }),
      catchError(_e => of(true))
    );
  }

  canActivateChild(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.canActivate(route, state);
  }
}
