/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  Component,
  Inject,
  Input,
  LOCALE_ID,
  OnInit,
  ViewChild,
  ViewEncapsulation,
  AfterContentChecked
} from '@angular/core';
import { BehaviorSubject, of } from 'rxjs';
import { filter, map, tap, switchMap, takeUntil } from 'rxjs/operators';

import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { AppConfig } from '@conf/app.config';
import { AppConfigInterface } from '@models/app-config.model';
import { Taxon } from '@models/taxonomy.model';
import { ObservationData } from '@models/observation.model';
import { TaxonomyService } from '@services/taxonomy.service';
import { ShareData, WebshareComponent } from '@shared/webshare/webshare.component';
import { UnsubscribeOnDestroy } from '@helpers/unsubscribe-on-destroy';

type Config = Pick<AppConfigInterface, 'API_ENDPOINT'>;

@Component({
  selector: 'app-observation-details',
  encapsulation: ViewEncapsulation.None,
  templateUrl: 'observation-details.component.html'
})
export class ObservationDetailsComponent extends UnsubscribeOnDestroy
  implements OnInit, AfterContentChecked {
  config: Config = AppConfig;
  navigator: Navigator = window.navigator;
  @ViewChild(WebshareComponent) shareButton?: WebshareComponent;
  sharedData: ShareData = {};
  @Input() data!: Partial<ObservationData>;
  taxon$ = new BehaviorSubject<Taxon | undefined>(undefined);
  imgMaxHeight: string | undefined;

  constructor(
    @Inject(LOCALE_ID) public localeId: string,
    public modal: NgbActiveModal,
    public taxonService: TaxonomyService
  ) {
    super();
  }

  ngOnInit(): void {
    of(this.data)
      .pipe(
        filter(data => !!data?.cd_nom === true),
        // tslint:disable-next-line: no-non-null-assertion
        map(data => this.taxonService.getTaxon(data.cd_nom!)),
        switchMap(taxon => taxon),
        tap(result => this.taxon$.next(result)),
        takeUntil(this.onDestroy$)
      )
      .subscribe();
  }

  ngAfterContentChecked(): void {
    this.imgMaxHeight = `${
      document.querySelector('app-observation-details > div.modal-body')?.clientHeight
    }px`;
  }

  canShare(): boolean {
    return 'share' in this.navigator;
  }

  setupShare(): void {
    if (this.data) {
      let url = document.location.href;
      const canonicalElement = document.querySelector('link[rel=canonical]');
      if (canonicalElement !== null) {
        url = canonicalElement.getAttribute('href') as string;
      }
      this.sharedData = {
        title: `${document.title} Details Observation #${this.data.id_observation}`,
        text: this.data.comment,
        url
      };
    }
  }
}
