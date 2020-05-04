import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
  ViewEncapsulation,
  Inject,
  LOCALE_ID
} from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { FeatureCollection, Feature } from 'geojson';

import { AppConfigInterface, Taxonomy } from '../../../core/models';
import { AppConfig } from '../../../../conf/app.config';
import { TaxonomyService } from '../../../services/taxonomy.service';

type AppConfigObsList = Pick<AppConfigInterface, 'API_ENDPOINT'>;

@Component({
  selector: 'app-obs-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.css'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ObsListComponent implements OnChanges {
  readonly AppConfig: AppConfigObsList = AppConfig;
  @Input()
  observations!: FeatureCollection;
  @Input()
  taxonomy!: Taxonomy;
  @Output() obsSelected: EventEmitter<Feature> = new EventEmitter();
  observations$: BehaviorSubject<Feature[] | null> = new BehaviorSubject<Feature[] | null>(null);

  constructor(@Inject(LOCALE_ID) public localeId: string, public taxonService: TaxonomyService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (this.observations && changes.observations && changes.observations.currentValue) {
      this.observations$.next(this.observations.features);
    }
    if (this.taxonomy && changes.taxonomy && changes.taxonomy.currentValue) {
      this.taxonService.taxa = { ...this.taxonService.taxa, ...this.taxonomy };
    }
  }

  onSelected(feature: Feature): void {
    this.obsSelected.emit(feature);
  }

  trackByObs(_index: number, obs: Feature): number {
    return obs.properties?.id_observation;
  }
}
