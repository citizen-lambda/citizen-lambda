import { OnDestroy } from '@angular/core';
import { Subject, Observable } from 'rxjs';

export abstract class UnsubscribeOnDestroy implements OnDestroy {
  private _unsubscriptionOnDestroy = new Subject<true>();

  public get onDestroy$(): Observable<true> {
    return this._unsubscriptionOnDestroy.asObservable();
  }

  ngOnDestroy(): void {
    this._unsubscriptionOnDestroy.next(true);
    this._unsubscriptionOnDestroy.complete();
  }
}
