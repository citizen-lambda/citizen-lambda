import { Injectable, Inject, LOCALE_ID } from '@angular/core';
import { BehaviorSubject, Observable, zip, forkJoin } from 'rxjs';
import {
  map,
  distinctUntilChanged,
  share,
  pluck,
  filter,
  flatMap,
  switchMap,
  take,
  takeUntil
} from 'rxjs/operators';

import { FeatureCollection, Feature } from 'geojson';

import { AppConfig } from '@conf/app.config';
import { Program } from '@features/programs/models/programs.models';
import { ProgramsService } from '@services/programs.service';
import { Taxon } from '@models/taxonomy.model';
import { TaxonomyService } from '@services/taxonomy.service';
import {
  ObsState,
  ConfigObsFeatures,
  Municipality,
  SharedContext
} from '@models/observation.model';
import { UnsubscribeOnDestroy } from '@helpers/unsubscribe-on-destroy';
import { composeFnsAsync } from '@helpers/compose';
import { groupBy } from '@helpers/groupby';
import { sorted } from '@helpers/sorted';

// tslint:disable-next-line: variable-name
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
export class ObservationsFacade extends UnsubscribeOnDestroy /* implements OnDestroy */ {
  ConfigObsFeatures = (AppConfig as ConfigObsFeatures).OBSERVATIONS_FEATURES;
  private store = new BehaviorSubject<ObsState>(_state);
  private state$ = this.store.asObservable();
  configGroupBy = this.ConfigObsFeatures?.TAXONOMY.GROUP;

  sharedContext: SharedContext = {};

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

  // tslint:disable-next-line: variable-name
  private _programId = new BehaviorSubject<number>(0);
  programId$ = this._programId.asObservable();
  set programId(pid: number) {
    this._programId.next(pid);
  }

  // tslint:disable-next-line: variable-name
  private _programs = new BehaviorSubject<Program[]>([]);
  programs$ = this._programs.asObservable();
  set programs(programs: Program[]) {
    this._programs.next(programs);
  }

  stream$ = this.programService.getProgramStream();

  features$ = this.state$.pipe(
    pluck<ObsState, Feature[]>('observations', 'features'),
    filter(features => features?.length > 0),
    distinctUntilChanged()
  );

  sampledTaxonomy$ = this.features$.pipe(
    map(items => {
      return Array.from(
        new Map<number, Feature>(items.map(item => [+`${item.properties?.cd_nom}`, item])).values()
      ).reduce((acc: Observable<Taxon>[], item: Feature) => {
        return [...acc, this.taxonomyService.getTaxon(item.properties?.cd_nom)];
      }, []);
    }),
    flatMap(items => zip(...items)),
    map(taxa => {
      const prop = this.localeId.startsWith('fr') ? 'nom_vern' : 'nom_vern_eng';
      const r = taxa.sort(sorted(prop));
      return this.configGroupBy ? this.applyConfigGroupBy(r) : r;
    })
  );

  municipalities$ = this.features$.pipe(
    map(items => {
      return Array.from(
        new Map<string, Municipality>(
          items.map(item => [item.properties?.municipality.code, item.properties?.municipality])
        ).values() as IterableIterator<Municipality>
      ).sort(sorted('name'));
    })
  );

  set selected(selected: Feature) {
    this.updateState({
      ..._state,
      selected
    });
  }

  // tslint:disable-next-line: variable-name
  _filteredObservations = new BehaviorSubject<Feature[]>([]);
  filteredObservations$ = this._filteredObservations.asObservable();

  selectedMunicipality: Municipality | null = null;
  selectedTaxonId = 0;

  private updateState(state: ObsState): void {
    this.store.next((_state = state));
  }

  filterTaxon = (obs: Feature[]): Feature[] =>
    this.selectedTaxonId !== 0
      ? obs.filter(o => o.properties?.cd_nom === +this.selectedTaxonId)
      : obs;

  filterMunicipality = (obs: Feature[]): Feature[] =>
    this.selectedMunicipality != null
      ? obs.filter(o => o.properties?.municipality.code === this.selectedMunicipality?.code)
      : obs;

  constructor(
    @Inject(LOCALE_ID) public localeId: string,
    private programService: ProgramsService,
    public taxonomyService: TaxonomyService
  ) {
    super();

    this.programId$
      .pipe(
        filter(id => id > 0),
        flatMap((pid: number) =>
          forkJoin([
            this.programService.getProgramTaxonomyList(pid),
            this.programService.getProgram(pid)
          ])
        ),
        takeUntil(this.onDestroy$)
      )
      .subscribe(([taxa, program]) => {
        this.updateState({
          ..._state,
          program: this.programService.feature2Program(program.features[0])
        });
        this.sharedContext.taxa = taxa;
        this.sharedContext.program = program;
      });

    this.programId$
      .pipe(
        filter(id => id > 0),
        switchMap(id => this.programService.getProgramObservations(id)),
        takeUntil(this.onDestroy$)
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
        map(observations =>
          composeFnsAsync(this.filterTaxon, this.filterMunicipality)(observations)
        ),
        takeUntil(this.onDestroy$)
      )
      .subscribe(async observations => {
        this._filteredObservations.next(await observations);
      });
  }

  onFilterChange(): void {
    this.features$
      .pipe(
        take(1),
        map(observations =>
          composeFnsAsync(this.filterTaxon, this.filterMunicipality)(observations)
        )
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
        features: [feature, ..._state.observations.features]
      }
    });
  }

  applyConfigGroupBy(r: Taxon[]): { [key: string]: Taxon[] } {
    if (typeof this.configGroupBy === 'function') {
      return groupBy(r, this.configGroupBy(this.localeId));
    }
    if (typeof this.configGroupBy === 'string') {
      return groupBy(r, this.configGroupBy);
    }
    throw Error('configGroupBy is neither a function or property string');
  }
}
