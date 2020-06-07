import { Injectable, ApplicationRef } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { interval, concat } from 'rxjs';
import { first } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class UpdateService {
  constructor(private appRef: ApplicationRef, private updates: SwUpdate) {
    if (this.updates.isEnabled) {
      const appIsStable$ = this.appRef.isStable.pipe(first(stable => stable === true));
      const everyHour$ = interval(60 * 60 * 1000);
      const everyHourOnceAppIsStable$ = concat(appIsStable$, everyHour$);

      everyHourOnceAppIsStable$.subscribe(() => updates.checkForUpdate());

      this.updates.available.subscribe(event => {
        console.info('current version is', event.current);
        console.info('available version is', event.available);

        if (confirm('New version available. Load new version?')) {
          updates.activateUpdate().then(() => document.location.reload());
        }
      });

      this.updates.activated.subscribe(event => {
        console.info('old version was', event.previous);
        console.info('new version is', event.current);
      });
    }
  }
}
