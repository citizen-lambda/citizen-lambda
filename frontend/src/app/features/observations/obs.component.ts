import {
  Component,
  ViewEncapsulation,
  OnDestroy,
  ViewChild,
  HostListener,
  AfterViewInit,
  Inject,
  LOCALE_ID,
  Injectable
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { zip, forkJoin, combineLatest, Observable, Subject, BehaviorSubject } from 'rxjs';
import {
  map,
  flatMap,
  filter,
  takeUntil,
  pluck,
  share,
  take,
  switchMap,
  distinctUntilChanged
} from 'rxjs/operators';

import { FeatureCollection, Feature } from 'geojson';
import * as L from 'leaflet';

import { AppConfig } from '../../../conf/app.config';
import { Program } from '../programs/programs.models';
import { GncProgramsService } from '../programs/gnc-programs.service';
import { TaxonomyService } from '../../services/taxonomy.service';
import { Taxonomy, Taxon } from '../../core/models';
import { sorted } from '../../helpers/sorted';
import { groupBy } from '../../helpers/groupby';
import { composeAsync } from '../../helpers/compose';
import { ObsMapComponent } from '../../shared/observations-shared/map/map.component';
import { ObsListComponent } from '../../shared/observations-shared/list/list.component';
import { ModalFlowService } from '../../shared/observations-shared/modalflow/modalflow.service';
import { SeoService } from '../../services/seo.service';
import { ObsState, ConfigObsFeatures, ConfigModalFlow, Municipality } from './observation.model';

let _state: ObsState = {
  program: {} as Program,
  observations: {} as FeatureCollection,
  selected: {} as Feature
};

@Injectable()
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
    filter(features => !!features)
  );

  sampledTaxonomy$ = this.features$.pipe(
    map(items => {
      return Array.from(
        // tslint:disable-next-line: no-non-null-assertion
        new Map(items.map(item => [+`${item.properties!.cd_nom}`, item])).values()
      ).reduce((acc: Observable<Taxon>[], item: Feature) => {
        return [
          ...acc,
          // tslint:disable-next-line: no-non-null-assertion
          this.taxonomyService.getTaxon(item.properties!.cd_nom)
        ];
      }, []);
    }),
    flatMap(items => zip(...items)),
    map(taxa => {
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
      return r;
    })
  );

  municipalities$ = this.features$.pipe(
    map(items => {
      return Array.from(
        new Map(
          items.map(item => [
            // tslint:disable-next-line: no-non-null-assertion
            +`${item.properties!.municipality.code}`,
            // tslint:disable-next-line: no-non-null-assertion
            item.properties!.municipality
          ])
        ).values() as IterableIterator<Municipality>
      ).sort(sorted('name'));
    }),
    share()
  );

  set selected(selected: Feature) {
    this.updateState({
      ..._state,
      selected: selected
    });
  }

  _filteredObservations = new BehaviorSubject<Feature[]>([]);
  filteredObservations$ = this._filteredObservations.asObservable();

  selectedMunicipality: any = null;
  selectedTaxonID: string | null = null;

  filterTaxon = (obs: Feature[]): Feature[] =>
    !!obs && !!this.selectedTaxonID
      ? // tslint:disable-next-line: no-non-null-assertion
        obs.filter(o => o.properties!.cd_nom === parseInt(this.selectedTaxonID!, 10))
      : obs;
  filterMunicipality = (obs: Feature[]): Feature[] =>
    !!obs && !!this.selectedMunicipality
      ? // tslint:disable-next-line: no-non-null-assertion
        obs.filter(o => o.properties!.municipality.code === this.selectedMunicipality.code)
      : obs;

  constructor(
    @Inject(LOCALE_ID) public localeId: string,
    private programService: GncProgramsService,
    public taxonomyService: TaxonomyService
  ) {
    this.programID$
      .pipe(
        filter(id => id >= 1),
        flatMap((program_id: number) =>
          forkJoin([
            this.programService.getProgramTaxonomyList(program_id),
            this.programService.getProgram(program_id)
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
          observations: observations
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
        map(observations => composeAsync(this.filterTaxon, this.filterMunicipality)(observations))
      )
      .subscribe(async observations => {
        this._filteredObservations.next(await observations);
      });
  }

  onNewObservation(feature: Feature) {
    this.updateState({
      ..._state,
      observations: {
        type: 'FeatureCollection',
        features: [feature, ...(_state.observations.features as Feature[])]
      } as FeatureCollection
    });
  }
}

/* ***************************************************************************** */

@Component({
  selector: 'app-observations',
  templateUrl: './obs.component.html',
  styleUrls: ['./obs.component.css', '../home/home.component.css'],
  encapsulation: ViewEncapsulation.None,
  providers: [ModalFlowService, ObservationsFacade]
})
export class ObsComponent implements AfterViewInit, OnDestroy {
  readonly ConfigObsFeatures = (AppConfig as ConfigObsFeatures).OBSERVATIONS_FEATURES;
  readonly appConfig: ConfigModalFlow = AppConfig;
  AddAnObservationLabel = (this.appConfig.program_add_an_observation as { [name: string]: string })[
    this.localeId
  ];
  private unsubscribe$ = new Subject<void>();
  @ViewChild(ObsMapComponent, { static: false }) thematicMap!: ObsMapComponent;
  @ViewChild(ObsListComponent, { static: false }) obsList!: ObsListComponent;

  constructor(
    @Inject(LOCALE_ID) public localeId: string,
    protected router: Router,
    private route: ActivatedRoute,
    public flowService: ModalFlowService,
    protected seo: SeoService,
    public facade: ObservationsFacade
  ) {
    combineLatest([
      this.route.params.pipe(map(params => parseInt(params['id'], 10))),
      this.route.data
    ])
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(([id, _]) => {
        this.facade.programID = id;
      });

    this.facade.program$.subscribe(program => {
      this.seo.setMetaTag({
        name: 'description',
        content: program.short_desc
      });
      this.seo.setTitle(`${program.title}`);
    });
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  ngAfterViewInit() {
    this.thematicMap.click
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((point: L.Point) => (this.facade.sharedContext.coords = point));

    combineLatest([this.facade.stream$, this.facade.programID$])
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(([items, program_id]) => {
        console.debug(items, program_id);
        if (!!items.length) {
          try {
            const event = JSON.parse(items.toString());
            if (
              'type' in event &&
              event.type === 'update' &&
              'program' in event.data &&
              parseInt(event.data.program, 10) === program_id
            ) {
              if ('NewObservation' in event.data) {
                // TODO: leverage newObservationEventHandler
                this.facade.onNewObservation(event.data.NewObservation as Feature);
              }
              // …
            }
          } catch (error) {
            console.error(error);
          }
        }
      });
  }

  onListToggle(): void {
    this.thematicMap.observationMap.invalidateSize();
  }

  onObsSelected($event: Feature) {
    this.facade.selected = $event;
    this.thematicMap.showPopup($event);
  }

  onDetailsRequested($event: number) {
    this.facade.features$
      .pipe(
        // tslint:disable-next-line: no-non-null-assertion
        map(features => features.filter(feature => feature!.properties!.id_observation === $event)),
        take(1)
      )
      .subscribe(features => {
        this.onObsSelected(features[0]);
      });
    this.router.navigate(['details', $event], {
      fragment: 'observations',
      relativeTo: this.route
    });
    // set selected if not already set ?
  }

  /* @HostListener('document:NewObservationEvent', ['$event'])
  newObservationEventHandler(e: CustomEvent): void {
    e.stopPropagation();
    this.facade.onNewObservation(e.detail as Feature);
  } */
}
