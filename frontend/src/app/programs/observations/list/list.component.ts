import {
  Component,
  OnChanges,
  Input,
  SimpleChanges,
  Output,
  EventEmitter
} from "@angular/core";
import { merge, Subject } from "rxjs";
import { pluck, share } from "rxjs/operators";

import { FeatureCollection, Feature } from "geojson";

import {
  TaxonomyList,
  TaxonomyListItem,
  ObservationFeature
} from "../observation.model";
import { AppConfig } from "../../../../conf/app.config";

@Component({
  selector: "app-obs-list",
  templateUrl: "./list.component.html",
  styleUrls: ["./list.component.css"]
})
export class ObsListComponent implements OnChanges {
  readonly AppConfig = AppConfig;
  @Input("observations") observations: FeatureCollection;
  @Input("taxa") surveySpecies: TaxonomyList;
  @Output("obsSelected") obsSelected: EventEmitter<
    Feature
  > = new EventEmitter();
  municipalities: any[] = [];
  observationList: Feature[] = [];
  program_id: number = 0;
  taxa: any[] = [];

  selectedTaxon: TaxonomyListItem | undefined;
  selectedMunicipality: any = null;
  changes$ = new Subject<SimpleChanges>();
  observations$ = new Subject<Feature[]>();
  features$ = merge(
    this.observations$,
    this.changes$.pipe(
      pluck("observations", "currentValue", "features"),
      share()
    )
  );

  constructor() {}

  ngOnChanges(changes: SimpleChanges) {
    this.changes$.next(changes);

    if (this.observations && changes.observations.currentValue) {
      this.observationList = this.observations["features"];
      this.observations$.next(this.observations["features"]);
      this.municipalities = this.observations.features
        .map(features => features.properties)
        .filter(property => !!property)
        .map(property => property.municipality)
        .filter(
          municipality =>
            !!municipality && municipality.name && municipality.code
        )
        .filter((v, i, a) => a.indexOf(v) === i);
    }
  }

  onFilterChange(): void {
    let filters: { taxon: string | null; municipality: string | null } = {
      taxon: null,
      municipality: null
    };
    // WARNING: map.observations is connected to this.observationList
    this.observationList = this.observations["features"].filter(obs => {
      let results: boolean[] = [];
      if (this.selectedMunicipality) {
        results.push(
          obs.properties.municipality.code == this.selectedMunicipality.code
        );
        filters.municipality = this.selectedMunicipality.code;
      }
      if (this.selectedTaxon) {
        results.push(
          obs.properties.cd_nom == this.selectedTaxon.taxref["cd_nom"]
        );
        filters.taxon = this.selectedTaxon.taxref["cd_nom"];
      }
      return results.indexOf(false) < 0;
    });
    this.observations$.next(this.observationList);

    if (filters.taxon || filters.municipality) {
      const event: CustomEvent = new CustomEvent("ObservationFilterEvent", {
        bubbles: true,
        cancelable: true,
        detail: filters
      });
      document.dispatchEvent(event);
    }
  }

  onSelected(feature: Feature): void {
    this.obsSelected.emit(feature);
  }

  trackByObs(index: number, obs: ObservationFeature): number {
    return obs.properties.id_observation;
  }
}
