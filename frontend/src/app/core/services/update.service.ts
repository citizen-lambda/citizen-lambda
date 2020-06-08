import { Injectable, ApplicationRef } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { interval, concat } from 'rxjs';
import { first } from 'rxjs/operators';

interface MyAppData {
  version?: string;
  changelog?: string;
}

const updateCheckIntervalSeconds = 6 * 60 * 1000; // mv to conf

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
        const prompt = this.preparePromptContent(event.available.appData as MyAppData);
        if (confirm(prompt)) {
          this.doAppUpdate();
        }
      }
    });
  }

  extractUpdateInfo(info: MyAppData): { swVersion: string; changelog: string } {
    let swVersion = '';
    let changelog = '';
    if ('version' in info) {
      swVersion = ` ${info.version}`;
    }
    if ('changelog' in info) {
      changelog = `changelog:\n${info.changelog}\n`;
    }
    return { swVersion, changelog };
  }

  preparePromptContent(appData: MyAppData): string {
    const { swVersion, changelog } = this.extractUpdateInfo(appData);
    return `New version${swVersion} available.\n${changelog}\nLoad new version?`;
  }

  doCheckForUpdate(): void {
    console.debug(`Checking for new version @${new Date().toISOString()}`);
    this.updates.checkForUpdate();
  }

  doAppUpdate(): void {
    this.updates.activateUpdate().then(() => document.location.reload());
    this.updates.activated.subscribe(event => {
      console.info(`Done updating app from ${event.previous} to ${event.current}`);
    });
  }
}
