import { OnDestroy } from '@angular/core';
import { Subject, Observable } from 'rxjs';

export abstract class UnsubscribeOnDestroy implements OnDestroy {
  private unsubscriptionOnDestroy = new Subject<true>();

  public get onDestroy$(): Observable<true> {
    return this.unsubscriptionOnDestroy.asObservable();
  }

  ngOnDestroy(): void {
    this.unsubscriptionOnDestroy.next(true);
  }
}
