import { Injectable, ApplicationRef } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GncService {
  state = 0;

  constructor(private app: ApplicationRef) {}

  setState(): void {
    this.state = Math.random();
    // Run change detection
    this.app.tick();
  }
}
