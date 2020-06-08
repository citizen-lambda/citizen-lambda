import { Injectable, ApplicationRef } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { interval, concat } from 'rxjs';
import { first } from 'rxjs/operators';

type myAppData = { [name: string]: string };

const updateCheckIntervalSeconds = 10 * 1000; // mv to conf

@Injectable({
  providedIn: 'root'
})
export class UpdateService {
  constructor(private appRef: ApplicationRef, private updates: SwUpdate) {
    if (this.updates.isEnabled) {
      const appIsStable$ = this.appRef.isStable.pipe(first(stable => stable === true));
      const everySoOften$ = interval(updateCheckIntervalSeconds);
      const everySoOftenOnceAppIsStable$ = concat(appIsStable$, everySoOften$);

      everySoOftenOnceAppIsStable$.subscribe(() => {
        this.doCheckForUpdate();
      });

      this.doListenForUpdate();
    }
  }

  doListenForUpdate(): void {
    this.updates.available.subscribe(event => {
      console.info('current version is', event.current, event.current.appData);
      console.info('available version is', event.available, event.available.appData);

      if (event && event.available && event.available.appData) {
        const prompt = this.extractUpdateInfo(event.available.appData as myAppData);
        if (confirm(prompt)) {
          this.doAppUpdate();
        }
      }
    });
  }

  extractUpdateInfo(info: myAppData): string {
    let version: string | undefined;
    let changelog: string | undefined;

    if ('version' in info) {
      version = info['version'] + ' ';
    }

    if ('changelog' in info) {
      changelog = 'changelog:\n' + info['changelog'] + '\n';
    }
    return `New version ${version ? version : ''}available.\n${
      changelog ? changelog : ''
    }\nLoad new version?`;
  }

  doCheckForUpdate(): void {
    console.debug(`Checking for new version @${new Date().toISOString()}`);
    this.updates.checkForUpdate();
  }

  doAppUpdate() {
    this.updates.activateUpdate().then(() => document.location.reload());
    this.updates.activated.subscribe(event => {
      console.info('old version was', event.previous);
      console.info('new version is', event.current);
    });
  }
}
