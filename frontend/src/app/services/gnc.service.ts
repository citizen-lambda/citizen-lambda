import { Injectable, ApplicationRef } from '@angular/core';

import { AppConfig } from '../../conf/app.config';

@Injectable({
  providedIn: 'root'
})
export class GncService {
  state = 0;

  constructor(private app: ApplicationRef) {}

  setState() {
    this.state = Math.random();
    // Run change detection
    this.app.tick();
  }
}
