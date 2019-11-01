import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
  ViewEncapsulation
  // HostListener
} from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

import { FeatureCollection, Feature } from 'geojson';

import { Taxonomy, Taxon } from '../observation.model';
import { IAppConfig } from '../../../core/models';
import { AppConfig } from '../../../../conf/app.config';
import { TaxonomyService } from 'src/app/api/taxonomy.service';

type AppConfigObsList = Pick<IAppConfig, 'API_ENDPOINT'>;

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

  constructor(public taxonService: TaxonomyService) { }

  ngOnChanges(changes: SimpleChanges) {
    if (this.observations && changes.observations && changes.observations.currentValue) {
      this.observations$.next(this.observations.features);
    }
    if (this.taxonomy && changes.taxonomy && changes.taxonomy.currentValue) {
      // console.debug(this.taxonomy[60038]);
      // this.taxonService.getTaxon(60038).subscribe(t => console.debug(`taxon: ${t.nom_vern}`));
      this.taxonService.taxa = {...this.taxonService.taxa, ...this.taxonomy}
    }
  }

  onSelected(feature: any): void {
    console.debug(feature);
    this.obsSelected.emit(feature);
  }

  trackByObs(_index: number, obs: Feature & { properties: { [key: string]: any } }): number {
    return obs.properties.id_observation;
  }

  randomItem(a: Array<any>): any {
    if (a && !!a.length) {
      // tslint:disable-next-line: no-bitwise
      return a[(Math.random() * a.length) >> 0];
    }
  }

  // @HostListener('document:NewObservationEvent', ['$event'])
  // public newObservationEventHandler(e: CustomEvent) {
  //   console.debug('[ObsListComponent.newObservationEventHandler]', e.detail);
  // }
}
