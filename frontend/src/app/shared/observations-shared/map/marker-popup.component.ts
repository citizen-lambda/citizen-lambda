import {
  Component,
  Input,
  ViewEncapsulation,
  ChangeDetectionStrategy,
  OnInit,
  Inject,
  LOCALE_ID,
  TemplateRef,
  Output,
  EventEmitter,
  OnDestroy
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { of, BehaviorSubject } from 'rxjs';

import { AppConfig } from '@conf/app.config';
import { Taxon } from '@models/taxonomy.model';
import { ObservationData } from '@models/observation.model';
import { TaxonomyService } from '@services/taxonomy.service';

@Component({
  selector: 'app-marker-popup',
  templateUrl: 'popup.template.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MarkerPopupComponent implements OnInit, OnDestroy {
  AppConfig = AppConfig;
  @Input() data!: Partial<ObservationData>;
  @Input() popupTemplate!: TemplateRef<HTMLElement>;
  @Output() detailsRequest = new EventEmitter<number>();
  taxon$ = new BehaviorSubject<(Partial<ObservationData> & Taxon) | undefined>(undefined);
  closeResult = '';

  constructor(
    @Inject(LOCALE_ID) public localeId: string,
    protected router: Router,
    private route: ActivatedRoute,
    public taxonService: TaxonomyService
  ) {}

  ngOnInit(): void {
    of(this.data).subscribe(data => {
      if (!!data && data.cd_nom) {
        this.taxonService.getTaxon(data.cd_nom).subscribe(t => {
          this.taxon$.next({ ...t, ...data });
        });
      }
    });
  }

  ngOnDestroy(): void {
    // should adapt strategy to leaflet current setting: singleton ?
    console.debug('popup destroyed:', this.data.id_observation);
  }

  onObservationDetails(): void {
    this.detailsRequest.emit(this.data.id_observation);
  }
}
