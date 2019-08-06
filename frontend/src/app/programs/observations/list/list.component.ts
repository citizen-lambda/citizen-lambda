import {
  Component,
  OnChanges,
  Input,
  SimpleChanges,
  Output,
  EventEmitter
} from "@angular/core";
import { Subject } from "rxjs";
import { pluck, share, map } from "rxjs/operators";

import { FeatureCollection, Feature } from "geojson";

import {
  TaxonomyList,
  TaxonomyListItem,
  ObservationFeature
} from "../observation.model";
import { sorted } from "../../.././api/gnc-programs.service";
import { AppConfig } from "../../../../conf/app.config";

@Component({
  selector: "app-obs-list",
  templateUrl: "./list.component.html",
  styleUrls: ["./list.component.css"]
})
export class ObsListComponent implements OnChanges {
  readonly AppConfig = AppConfig;
  @Input("observations") observations!: FeatureCollection;
  @Input("taxa") surveySpecies!: TaxonomyList;
  @Output("obsSelected") obsSelected: EventEmitter<
    Feature
  > = new EventEmitter();
  observationList: Feature[] = [];

  selectedTaxon: TaxonomyListItem | null = null;
  selectedMunicipality: any = null;
  changes$ = new Subject<SimpleChanges>();
  observations$ = new Subject<Feature[]>();
  features$ = this.changes$.pipe(
    pluck("observations", "currentValue", "features"),
    map(items => items as FeatureCollection),
    share()
  );
  municipalities$ = this.features$.pipe(
    map(
      (
        items: Feature[] &
          {
            properties: {
              municipality: { name: string | null; code: number };
            };
          }[]
      ) => {
        const result = items.reduce(
          (
            acc: {
              data: { name: string | null; code: number }[];
              partials: { name: string | null; code: number }[];
            },
            item
          ) => {
            const i: {
              name: string | null;
              code: number;
            } = item.properties!.municipality;
            if (!!!i.name) {
              return {
                ...acc,
                ...{
                  partials: [...acc.partials, { ...i, ...{ name: "" } }]
                }
              };
            }
            const known = acc.data.find(
              k => k.name == i.name && k.code == i.code
            );
            return !known
              ? { ...acc, ...{ data: [...acc.data, i] } }
              : { ...acc };
          },
          { data: [], partials: [] }
        );
        return [...result.data, ...result.partials].sort(sorted("name")) as {
          name: string;
          code: number;
        }[];
      }
    ),
    share()
  );

  constructor() {}

  ngOnChanges(changes: SimpleChanges) {
    this.changes$.next(changes);

    if (
      this.observations &&
      changes.observations &&
      changes.observations.currentValue &&
      this.observations.features
    ) {
      this.observationList = this.observations.features;
      this.observations$.next(this.observations.features);
    }
  }

  onFilterChange(): void {
    let filters: { taxon: string | null; municipality: string | null } = {
      taxon: null,
      municipality: null
    };

    this.observationList = this.observations["features"].filter(obs => {
      let results: boolean[] = [];
      if (obs && this.selectedMunicipality) {
        results.push(
          obs.properties!.municipality.code == this.selectedMunicipality.code
        );
        filters.municipality = this.selectedMunicipality.code;
      }
      if (
        obs &&
        this.selectedTaxon &&
        this.selectedTaxon.taxref &&
        Object.keys(this.selectedTaxon.taxref).length > 0
      ) {
        results.push(
          obs.properties!.cd_nom == this.selectedTaxon.taxref["cd_nom"]
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

  onSelected(feature: any): void {
    console.debug(feature);
    this.obsSelected.emit(feature);
  }

  trackByObs(index: number, obs: ObservationFeature): number {
    return obs.properties.id_observation;
  }
}
