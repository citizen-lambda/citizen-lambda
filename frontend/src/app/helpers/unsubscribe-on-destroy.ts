import { Directive, OnDestroy } from '@angular/core';
import { Subject, Observable } from 'rxjs';

// TODO: Add Angular decorator.
@Directive()
export abstract class UnsubscribeOnDestroyDirective implements OnDestroy {
  private unsubscriptionOnDestroy = new Subject<true>();

  public get onDestroy$(): Observable<true> {
    return this.unsubscriptionOnDestroy.asObservable();
  }

  ngOnDestroy(): void {
    this.unsubscriptionOnDestroy.next(true);
  }
}
