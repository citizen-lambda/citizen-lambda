import { Component, Input, ViewEncapsulation, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { throwError, BehaviorSubject, Observable, OperatorFunction } from 'rxjs';
import { tap, catchError, map, distinctUntilChanged, share, pluck, filter } from 'rxjs/operators';

import type { CallbackFunctionVariadicAnyReturn } from '@models/app-config.model';
import type { Badge } from '@models/api.model';
import { AppConfig } from '@conf/app.config';
import { FlowComponentInterface } from '@shared/flow/flow';
import { AuthService } from '@services/auth.service';

export interface BadgeState {
  badges: Badge[];
  changes: Badge[];
  loading: boolean;
}

function differenceWith<T>(
  leftItems: T[],
  rightItems: T[],
  comparator: CallbackFunctionVariadicAnyReturn
): T[] {
  return rightItems.filter(
    _a => leftItems.findIndex(_b => comparator(rightItems, leftItems)) === -1
  );
}

const getNewBadges = (oldBadges: Badge[]): OperatorFunction<Badge[], Partial<BadgeState>> =>
  map((badges: Badge[]) => {
    if (!oldBadges || (oldBadges.length === 0 && badges && !!badges.length)) {
      return { badges, changes: [] };
    }

    if (!badges || badges?.length === 0) {
      return { badges: [], changes: [] };
    }

    const onlyInNewState = differenceWith<Badge>(
      oldBadges,
      badges,
      (a: Badge, b: Badge) => a.alt === b.alt
    );

    return { badges, changes: onlyInNewState };
  });

let _state: BadgeState = {
  badges: JSON.parse(localStorage.getItem('badges') || '[]') || [],
  changes: [],
  loading: true
};

@Injectable()
export class BadgeFacade {
  readonly AppConfig = AppConfig;
  private store = new BehaviorSubject<BadgeState>(_state);
  private state$ = this.store.asObservable();
  role_id = 0;
  username = 'undefined';

  badges$ = this.state$.pipe(
    map(state => state.badges),
    distinctUntilChanged(),
    share()
  );
  changes$ = this.state$.pipe(
    map(state => state.changes),
    distinctUntilChanged(),
    share()
  );
  loading$ = this.state$.pipe(map(state => state.loading));

  constructor(private auth: AuthService, private client: HttpClient) {
    this.username = localStorage.getItem('username') || 'undefined';
    this.getChanges();
  }

  getChanges(): void {
    const authorization = this.auth.haveAuthorization();
    if (authorization && this.AppConfig.REWARDS) {
      this.auth.ensureAuthorized().subscribe(
        user => {
          if (!!user && !!user.features && user.features['id_role']) {
            this.role_id = user.features.id_role;
            this.client
              .get<object>(`${this.AppConfig.API_ENDPOINT}/dev_rewards/${this.role_id}`)
              .pipe(
                pluck('badges'),
                // FIXME: untested
                getNewBadges(_state.badges),
                tap(x => {
                  const { badges, changes } = x;
                  if (changes && !!changes.length && !!badges) {
                    this.updateState({
                      ..._state,
                      badges,
                      changes,
                      loading: false
                    });
                    localStorage.setItem('badges', JSON.stringify(badges));
                  }
                }),
                catchError(error => {
                  console.error(error);
                  window.alert(error);
                  return throwError(error);
                })
              )
              .subscribe();
          }
        },
        error => {
          console.error(error);
          window.alert(error);
          return throwError(error);
        },
        undefined
      );
    }
  }

  getId(): number {
    return this.role_id;
  }

  private updateState(state: BadgeState): void {
    this.store.next((_state = state));
  }
}

// tslint:disable-next-line: max-classes-per-file
@Component({
  selector: 'app-reward',
  template: `
    <div *ngIf="reward$ | async as rewards">
      <div class="modal-body new-badge" (click)="clicked('background')">
        <div><img src="assets/user.jpg" /></div>
        <h5 i18n>Félicitations !</h5>
        <h6 i18n>
          { +rewards?.length, plural, =1 { Vous venez d&apos;obtenir ce badge } other { Vous venez
          d&apos;obtenir ces badges } }
        </h6>
        <p>
          <img
            [ngbTooltip]="b.alt"
            *ngFor="let b of rewards"
            [src]="AppConfig.API_ENDPOINT + b.img"
            [alt]="b.alt"
          />
        </p>
      </div>
    </div>
  `,
  styleUrls: ['./reward.component.css'],
  encapsulation: ViewEncapsulation.None,
  providers: [BadgeFacade]
})
export class RewardComponent implements FlowComponentInterface {
  readonly AppConfig = AppConfig;
  private _timeout: number | undefined;
  // private _init = 0;
  @Input() data: any;
  reward$: Observable<Badge[]> | null = null;

  constructor(public badges: BadgeFacade) {
    if (!badges.username || !this.AppConfig.REWARDS) {
      if (this._timeout) {
        window.clearTimeout(this._timeout);
      }
      this._timeout = window.setTimeout(() => this.close('REWARDS_DISABLED'), 0);
    } else {
      this.reward$ = this.badges.changes$.pipe(
        tap(reward => {
          // this._init++;

          const condition = reward && !!reward.length;

          if (!condition /*&& this._init > 1*/) {
            if (this._timeout) {
              clearTimeout(this._timeout);
            }
            this._timeout = window.setTimeout(() => this.close('NOREWARD'), 0);
          }
        }),
        filter(reward => reward && !!reward.length /*&& this._init > 1*/)
      );
    }
  }

  close(d: string): void {
    if (this.data) {
      this.data.service.close(d);
    }
  }

  clicked(d: string): void {
    this.close(d);
  }
}
