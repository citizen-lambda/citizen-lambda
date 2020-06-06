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

import { AppConfigInterface } from '@models/app-config.model';
import { Taxonomy } from '@models/taxonomy.model';
import { AppConfig } from '@conf/app.config';
import { TaxonomyService } from '@services/taxonomy.service';

type AppConfigObsList = Pick<AppConfigInterface, 'API_ENDPOINT'>;

@Component({
  selector: 'app-obs-list',
  templateUrl: './list.component.html',
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

  trackByObs(index: number, obs: Feature): number {
    return obs.properties?.id_observation;
  }
}
