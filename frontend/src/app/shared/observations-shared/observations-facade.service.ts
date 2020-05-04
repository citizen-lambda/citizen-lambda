import { Injectable, OnDestroy, Inject, LOCALE_ID } from '@angular/core';
import { Subject, BehaviorSubject, Observable, zip, forkJoin } from 'rxjs';
import {
  map,
  distinctUntilChanged,
  share,
  pluck,
  filter,
  flatMap,
  takeUntil,
  switchMap,
  take
} from 'rxjs/operators';

import { FeatureCollection, Feature } from 'geojson';

import { AppConfig } from '../../../conf/app.config';
import { Program } from '../../features/programs/programs.models';
import { ProgramsService } from '../../features/programs/programs.service';
import { Taxonomy, Taxon } from '../../core/models';
import { TaxonomyService } from '../../services/taxonomy.service';
import {
  ObsState,
  ConfigObsFeatures,
  Municipality
} from '../../features/observations/observation.model';
import { composeAsync } from '../../helpers/compose';
import { groupBy } from '../../helpers/groupby';
import { sorted } from '../../helpers/sorted';

let _state: ObsState = {
  // tslint:disable-next-line: no-object-literal-type-assertion
  program: {} as Program,
  // tslint:disable-next-line: no-object-literal-type-assertion
  observations: {} as FeatureCollection,
  // tslint:disable-next-line: no-object-literal-type-assertion
  selected: {} as Feature
};

@Injectable({
  providedIn: 'root'
})
export class ObservationsFacade implements OnDestroy {
  ConfigObsFeatures = (AppConfig as ConfigObsFeatures).OBSERVATIONS_FEATURES;
  private unsubscribe$ = new Subject<void>();
  private store = new BehaviorSubject<ObsState>(_state);
  private state$ = this.store.asObservable();

  sharedContext: {
    [name: string]: any;
    coords?: L.Point | undefined;
    program?: FeatureCollection;
    taxa?: Taxonomy;
  } = {};

  observations$ = this.state$.pipe(
    map(state => state.observations),
    distinctUntilChanged(),
    share()
  );

  selected$ = this.state$.pipe(
    map(state => state.selected),
    distinctUntilChanged(),
    share()
  );

  program$ = this.state$.pipe(
    map(state => state.program),
    distinctUntilChanged(),
    share()
  );

  private _programID = new BehaviorSubject<number>(0);
  programID$ = this._programID.asObservable();
  set programID(pid: number) {
    this._programID.next(pid);
  }

  private _programs = new BehaviorSubject<Program[]>([]);
  programs$ = this._programs.asObservable();
  set programs(programs: Program[]) {
    this._programs.next(programs);
  }

  stream$ = this.programService.getProgramStream();

  features$ = this.state$.pipe(
    pluck<ObsState, Feature[]>('observations', 'features'),
    filter(features => features != null)
  );

  sampledTaxonomy$ = this.features$.pipe(
    map(items => {
      return Array.from(
        new Map(items.map(item => [+`${item.properties?.cd_nom}`, item])).values()
      ).reduce((acc: Observable<Taxon>[], item: Feature) => {
        return [...acc, this.taxonomyService.getTaxon(item.properties?.cd_nom)];
      }, []);
    }),
    flatMap(items => zip(...items)),
    map(taxa => {
      const prop = this.localeId.startsWith('fr') ? 'nom_vern' : 'nom_vern_eng';
      const r = taxa.sort(sorted(prop));
      if (!!this.ConfigObsFeatures && !!this.ConfigObsFeatures.TAXONOMY.GROUP) {
        if (typeof this.ConfigObsFeatures.TAXONOMY.GROUP === 'function') {
          return groupBy(r, this.ConfigObsFeatures.TAXONOMY.GROUP(this.localeId));
        }
        if (typeof this.ConfigObsFeatures.TAXONOMY.GROUP === 'string') {
          return groupBy(r, this.ConfigObsFeatures.TAXONOMY.GROUP);
        }
      }
      return {};
    })
  );

  municipalities$ = this.features$.pipe(
    map(items => {
      return Array.from(
        new Map(
          items.map(item => [
            +`${item.properties?.municipality.code}`,
            item.properties?.municipality
          ])
        ).values() as IterableIterator<Municipality>
      ).sort(sorted('name'));
    }),
    share()
  );

  set selected(selected: Feature) {
    this.updateState({
      ..._state,
      selected
    });
  }

  _filteredObservations = new BehaviorSubject<Feature[]>([]);
  filteredObservations$ = this._filteredObservations.asObservable();

  selectedMunicipality: Municipality | null = null;
  selectedTaxonID: string | null = null; // ''

  filterTaxon = (obs: Feature[]): Feature[] =>
    obs?.length > 0 && this.selectedTaxonID != null
      ? obs.filter(
          o => this.selectedTaxonID && o.properties?.cd_nom === parseInt(this.selectedTaxonID, 10)
        )
      : // tslint:disable-next-line: semicolon
        obs;
  filterMunicipality = (obs: Feature[]): Feature[] =>
    obs?.length > 0 && this.selectedMunicipality != null
      ? obs.filter(o => o.properties?.municipality.code === this.selectedMunicipality?.code)
      : // tslint:disable-next-line: semicolon
        obs;

  constructor(
    @Inject(LOCALE_ID) public localeId: string,
    private programService: ProgramsService,
    public taxonomyService: TaxonomyService
  ) {
    this.programID$
      .pipe(
        filter(id => id >= 1),
        flatMap((pid: number) =>
          forkJoin([
            this.programService.getProgramTaxonomyList(pid),
            this.programService.getProgram(pid)
          ])
        ),
        takeUntil(this.unsubscribe$)
      )
      .subscribe(([taxa, program]) => {
        this.updateState({
          ..._state,
          program: this.programService.convertFeature2Program(program.features[0])
        });
        this.sharedContext.taxa = taxa;
        this.sharedContext.program = program;
      });

    this.programID$
      .pipe(
        takeUntil(this.unsubscribe$),
        filter(id => id > 0),
        switchMap(id => this.programService.getProgramObservations(id))
      )
      .subscribe(observations => {
        this.updateState({
          ..._state,
          observations
        });
      });

    this.observations$
      .pipe(
        pluck<FeatureCollection, Feature[]>('features'),
        takeUntil(this.unsubscribe$),
        map(observations => composeAsync(this.filterTaxon, this.filterMunicipality)(observations))
      )
      .subscribe(async observations => {
        this._filteredObservations.next(await observations);
      });
  }

  private updateState(state: ObsState): void {
    this.store.next((_state = state));
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  onFilterChange(): void {
    this.features$
      .pipe(
        take(1),
        map(observations => composeAsync(this.filterTaxon, this.filterMunicipality)(observations))
      )
      .subscribe(async observations => {
        this._filteredObservations.next(await observations);
      });
  }

  onNewObservation(feature: Feature): void {
    this.updateState({
      ..._state,
      observations: {
        type: 'FeatureCollection',
        features: [feature, ...(_state.observations.features as Feature[])]
      }
    });
  }
}
