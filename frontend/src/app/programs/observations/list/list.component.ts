import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
  ViewEncapsulation
} from "@angular/core";
import { Subject, Observable } from "rxjs";
import {
  pluck,
  // tap,
  filter,
  shareReplay,
  takeUntil
} from "rxjs/operators";

import { FeatureCollection, Feature } from "geojson";

import { TaxonomyList } from "../observation.model";
import { IAppConfig } from "../../../core/models";
import { AppConfig } from "../../../../conf/app.config";

type AppConfigObsList = Pick<IAppConfig, "API_ENDPOINT">;

@Component({
  selector: "app-obs-list",
  templateUrl: "./list.component.html",
  styleUrls: ["./list.component.css"],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ObsListComponent implements OnChanges {
  readonly AppConfig: AppConfigObsList = AppConfig;
  @Input("observations") observations!: FeatureCollection;
  @Input("taxa") surveySpecies!: TaxonomyList; // keep for the medias ?
  @Output("obsSelected") obsSelected: EventEmitter<
    Feature
  > = new EventEmitter();
  private unsubscribe$ = new Subject<void>();
  changes$ = new Subject<SimpleChanges>();
  observations$: Observable<Feature[]> = this.changes$.pipe(
    // tap(console.debug),
    pluck<Observable<FeatureCollection>, Feature[]>(
      "observations",
      "currentValue",
      "features"
    ),
    filter(o => !!o),
    takeUntil(this.unsubscribe$),
    shareReplay()
  );

  ngOnChanges(changes: SimpleChanges) {
    this.changes$.next(changes);
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  onSelected(feature: any): void {
    console.debug(feature);
    this.obsSelected.emit(feature);
  }

  trackByObs(
    _index: number,
    obs: Feature & { properties: { [key: string]: any } }
  ): number {
    return obs.properties.id_observation;
  }

  random(d: number) {
    return (Math.random() * d) >> 0;
  }
}
