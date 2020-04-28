import { Injectable, OnDestroy, Inject, LOCALE_ID } from '@angular/core';
import {
  ObsState,
  ConfigObsFeatures,
  Municipality,
} from 'src/app/features/observations/observation.model';
import { Program } from 'src/app/features/programs/programs.models';
import { FeatureCollection, Feature } from 'geojson';
import { AppConfig } from 'src/conf/app.config';
import { Subject, BehaviorSubject, Observable, zip, forkJoin } from 'rxjs';
import { Taxonomy, Taxon } from 'src/app/core/models';
import {
  map,
  distinctUntilChanged,
  share,
  pluck,
  filter,
  flatMap,
  takeUntil,
  switchMap,
  take,
} from 'rxjs/operators';
import { sorted } from 'src/app/helpers/sorted';
import { GncProgramsService } from 'src/app/features/programs/gnc-programs.service';
import { TaxonomyService } from 'src/app/services/taxonomy.service';
import { composeAsync } from 'src/app/helpers/compose';
import { groupBy } from 'src/app/helpers/groupby';

let _state: ObsState = {
  program: {} as Program,
  observations: {} as FeatureCollection,
  selected: {} as Feature,
};

@Injectable({
  providedIn: 'root',
})
export class ObservationsFacade implements OnDestroy {
  ConfigObsFeatures = (AppConfig as ConfigObsFeatures).OBSERVATIONS_FEATURES;
  private unsubscribe$ = new Subject<void>();
  private store = new BehaviorSubject<ObsState>(_state);
  private state$ = this.store.asObservable();

  sharedContext: {
    [name: string]: any;
    coords?: L.Point;
    program?: FeatureCollection;
    taxa?: Taxonomy;
  } = {};

  observations$ = this.state$.pipe(
    map((state) => state.observations),
    distinctUntilChanged(),
    share()
  );

  selected$ = this.state$.pipe(
    map((state) => state.selected),
    distinctUntilChanged(),
    share()
  );

  program$ = this.state$.pipe(
    map((state) => state.program),
    distinctUntilChanged(),
    share()
  );

  private _programID = new BehaviorSubject<number>(0);
  programID$ = this._programID.asObservable();
  set programID(program_id: number) {
    this._programID.next(program_id);
  }

  private _programs = new BehaviorSubject<Program[]>([]);
  programs$ = this._programs.asObservable();
  set programs(programs: Program[]) {
    this._programs.next(programs);
  }

  stream$ = this.programService.getProgramStream();

  features$ = this.state$.pipe(
    pluck<ObsState, Feature[]>('observations', 'features'),
    filter((features) => !!features)
  );

  sampledTaxonomy$ = this.features$.pipe(
    map((items) => {
      return Array.from(
        // tslint:disable-next-line: no-non-null-assertion
        new Map(items.map((item) => [+`${item.properties!.cd_nom}`, item])).values()
      ).reduce((acc: Observable<Taxon>[], item: Feature) => {
        return [
          ...acc,
          // tslint:disable-next-line: no-non-null-assertion
          this.taxonomyService.getTaxon(item.properties!.cd_nom),
        ];
      }, []);
    }),
    flatMap((items) => zip(...items)),
    map((taxa) => {
      const prop = this.localeId.startsWith('fr') ? 'nom_vern' : 'nom_vern_eng';
      const r = taxa.sort(sorted(prop));
      if (!!this.ConfigObsFeatures && !!this.ConfigObsFeatures.TAXONOMY.GROUP) {
        if (typeof this.ConfigObsFeatures.TAXONOMY.GROUP === 'function') {
          return groupBy(r, this.ConfigObsFeatures.TAXONOMY.GROUP(this.localeId)) as {
            [key: string]: Taxon[];
          };
        }
        if (typeof this.ConfigObsFeatures.TAXONOMY.GROUP === 'string') {
          return groupBy(r, this.ConfigObsFeatures.TAXONOMY.GROUP) as { [key: string]: Taxon[] };
        }
      }
      return null;
    })
  );

  municipalities$ = this.features$.pipe(
    map((items) => {
      return Array.from(
        new Map(
          items.map((item) => [
            // tslint:disable-next-line: no-non-null-assertion
            +`${item.properties!.municipality.code}`,
            // tslint:disable-next-line: no-non-null-assertion
            item.properties!.municipality,
          ])
        ).values() as IterableIterator<Municipality>
      ).sort(sorted('name'));
    }),
    share()
  );

  set selected(selected: Feature) {
    this.updateState({
      ..._state,
      selected: selected,
    });
  }

  _filteredObservations = new BehaviorSubject<Feature[]>([]);
  filteredObservations$ = this._filteredObservations.asObservable();

  selectedMunicipality: any = null;
  selectedTaxonID: string | null = null;

  filterTaxon = (obs: Feature[]): Feature[] =>
    !!obs && !!this.selectedTaxonID
      ? // tslint:disable-next-line: no-non-null-assertion
        obs.filter((o) => o.properties!.cd_nom === parseInt(this.selectedTaxonID!, 10))
      : // tslint:disable-next-line: semicolon
        obs;
  filterMunicipality = (obs: Feature[]): Feature[] =>
    !!obs && !!this.selectedMunicipality
      ? // tslint:disable-next-line: no-non-null-assertion
        obs.filter((o) => o.properties!.municipality.code === this.selectedMunicipality.code)
      : // tslint:disable-next-line: semicolon
        obs;

  constructor(
    @Inject(LOCALE_ID) public localeId: string,
    private programService: GncProgramsService,
    public taxonomyService: TaxonomyService
  ) {
    this.programID$
      .pipe(
        filter((id) => id >= 1),
        flatMap((program_id: number) =>
          forkJoin([
            this.programService.getProgramTaxonomyList(program_id),
            this.programService.getProgram(program_id),
          ])
        ),
        takeUntil(this.unsubscribe$)
      )
      .subscribe(([taxa, program]) => {
        this.updateState({
          ..._state,
          program: this.programService.convertFeature2Program(program.features[0]),
        });
        this.sharedContext.taxa = taxa;
        this.sharedContext.program = program;
      });

    this.programID$
      .pipe(
        takeUntil(this.unsubscribe$),
        filter((id) => id > 0),
        switchMap((id) => this.programService.getProgramObservations(id))
      )
      .subscribe((observations) => {
        this.updateState({
          ..._state,
          observations: observations,
        });
      });

    this.observations$
      .pipe(
        pluck<FeatureCollection, Feature[]>('features'),
        takeUntil(this.unsubscribe$),
        map((observations) => composeAsync(this.filterTaxon, this.filterMunicipality)(observations))
      )
      .subscribe(async (observations) => {
        this._filteredObservations.next(await observations);
      });
  }

  private updateState(state: ObsState) {
    this.store.next((_state = state));
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  onFilterChange(): void {
    this.features$
      .pipe(
        take(1),
        map((observations) => composeAsync(this.filterTaxon, this.filterMunicipality)(observations))
      )
      .subscribe(async (observations) => {
        this._filteredObservations.next(await observations);
      });
  }

  onNewObservation(feature: Feature) {
    this.updateState({
      ..._state,
      observations: {
        type: 'FeatureCollection',
        features: [feature, ...(_state.observations.features as Feature[])],
      } as FeatureCollection,
    });
  }
}
