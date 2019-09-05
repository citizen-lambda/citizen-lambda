import {
  Component,
  ViewEncapsulation,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ViewChild,
  HostListener,
  Inject,
  LOCALE_ID
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, combineLatest, fromEvent, Subject, Observable, BehaviorSubject } from 'rxjs';
import {
  throttleTime,
  map,
  flatMap,
  filter,
  takeUntil,
  pluck,
  shareReplay,
  share,
  take
} from 'rxjs/operators';

import { FeatureCollection, Feature } from 'geojson';
import * as L from 'leaflet';

import { AppConfig } from '../../../conf/app.config';
import { IAppConfig, AnchorNavigation } from '../../core/models';
import { Program } from '../programs.models';
import { ProgramsResolve } from '../../programs/programs-resolve.service';
import { GncProgramsService, sorted } from '../../api/gnc-programs.service';
import { ModalFlowService } from './modalflow/modalflow.service';
import { TaxonomyList, TaxonomyListItem } from './observation.model';
import { ObsMapComponent } from './map/map.component';
import { ObsListComponent } from './list/list.component';

type AppConfigObservations = Pick<IAppConfig, 'platform_participate'>;

export const compose = <R>(fn1: (a: R) => R, ...fns: Array<(a: R) => R>) =>
  fns.reduce((prevFn, nextFn) => value => prevFn(nextFn(value)), fn1);

@Component({
  selector: 'app-observations',
  templateUrl: './obs.component.html',
  styleUrls: ['./obs.component.css', '../../home/home.component.css'],
  encapsulation: ViewEncapsulation.None,
  providers: [ProgramsResolve]
})
export class ObsComponent extends AnchorNavigation implements OnInit, AfterViewInit, OnDestroy {
  readonly AppConfig: AppConfigObservations = AppConfig;
  @ViewChild(ObsMapComponent)
  obsMap!: ObsMapComponent;
  @ViewChild(ObsListComponent)
  obsList!: ObsListComponent;
  program: Program | undefined;
  programs: Program[] | undefined;
  programFeature: FeatureCollection | undefined;
  observations: FeatureCollection | undefined;
  surveySpecies: TaxonomyList | undefined;
  flowData: {
    [name: string]: any;
    coords?: L.Point;
    program?: FeatureCollection;
    taxa?: TaxonomyList;
  } = {};
  programID$ = this.route.params.pipe(map(params => parseInt(params['id'], 10)));
  private unsubscribe$ = new Subject<void>();
  observations$ = new BehaviorSubject<FeatureCollection | undefined>(undefined);
  obsAsFeatureArray$: Observable<Feature[]> = this.observations$.pipe(
    filter(collection => !!collection),
    pluck<FeatureCollection, Feature[]>('features'),
    filter(o => !!o),
    takeUntil(this.unsubscribe$),
    shareReplay()
  );
  filteredObservations$ = new BehaviorSubject<Feature[] | null>(null);
  municipalities$ = this.obsAsFeatureArray$.pipe(
    map((items: Feature[]) => {
      const result = items.reduce(
        (
          acc: {
            data: { name: string; code: number }[];
            partials: { name: string | null; code: number | null }[];
          },
          item
        ) => {
          const i: {
            name: string | null;
            code: number | null;
          } = item.properties ? item.properties.municipality : { name: null, code: null };
          if (!!!i.name) {
            return {
              ...acc,
              ...{
                partials: [...acc.partials, { ...i, ...{ name: '' } }]
              }
            };
          } else {
            const known = acc.data.find(k => k.name === i.name && k.code === i.code);
            return !known
              ? {
                  ...acc,
                  ...{
                    data: [...acc.data, i] as { name: string; code: number }[]
                  }
                }
              : { ...acc };
          }
        },
        { data: [], partials: [] }
      );
      return [...result.data, result.partials[0]].sort(sorted('name'));
    }),
    share()
  );
  selectedMunicipality: any = null;
  selectedTaxon: TaxonomyListItem | null = null;
  selectedTaxonFilter = (obs: Feature[]): Feature[] =>
    obs &&
    this.selectedTaxon &&
    this.selectedTaxon.taxref &&
    Object.keys(this.selectedTaxon.taxref).length
      ? obs.filter(
          o =>
            o &&
            o.properties &&
            Object.keys(o.properties).length &&
            // tslint:disable-next-line: no-non-null-assertion
            o.properties.taxref.cd_ref === this.selectedTaxon!.taxref['cd_ref']
        )
      : // tslint:disable-next-line: semicolon
        obs;
  selectedMunicipalityFilter = (obs: Feature[]): Feature[] =>
    obs && this.selectedMunicipality
      ? obs.filter(
          o =>
            o &&
            o.properties &&
            Object.keys(o.properties) &&
            o.properties.municipality.code === this.selectedMunicipality.code
        )
      : // tslint:disable-next-line: semicolon
        obs;

  constructor(
    @Inject(LOCALE_ID) readonly localeId: string,
    protected router: Router,
    protected route: ActivatedRoute,
    private programService: GncProgramsService,
    public flowService: ModalFlowService
  ) {
    super(router, route);
    combineLatest(this.programID$, this.route.data)
      .pipe(
        map(([id, data]) => {
          this.programs = data.programs;
          this.program = data.programs.find((p: Program) => p.id_program === id);
          // tslint:disable-next-line: no-non-null-assertion
          return this.program!.id_program;
        }),
        flatMap(program_id =>
          forkJoin([
            this.programService.getProgramTaxonomyList(program_id),
            this.programService.getProgram(program_id)
          ])
        ),
        takeUntil(this.unsubscribe$)
      )
      .subscribe(([taxa, program]) => {
        // console.debug(taxa, program);
        this.programFeature = program;
        this.surveySpecies = taxa;
        this.flowData.taxa = taxa;

        this.flowData.program = program;
      });
  }

  ngOnInit() {
    this.programID$.pipe(takeUntil(this.unsubscribe$)).subscribe(id => {
      this.programService.getProgramObservations(id).subscribe(observations => {
        this.observations = observations;
        this.observations$.next(observations);
      });
    });

    this.obsAsFeatureArray$.subscribe(o => this.filteredObservations$.next(o));

    this.filteredObservations$.subscribe(observations => {
      // FIXME: observations changes dispatch
      this.observations = {
        type: 'FeatureCollection',
        features: observations || []
      };
    });
  }

  ngAfterViewInit() {
    // this.obsMap.observationMap.invalidateSize();

    // todo: move to directive and make the <p> tag an <article>
    const element: HTMLElement | null = document.querySelector('#slider .carousel-text div');
    if (element) {
      const scroll$ = fromEvent(element, 'scroll').pipe(
        throttleTime(10),
        map(() =>
          element.offsetHeight + element.scrollTop === element.scrollHeight
            ? 'bottom'
            : element.scrollTop === 0
            ? 'top'
            : null
        ),
        filter(reached => reached !== null),
        takeUntil(this.unsubscribe$)
      );

      const swapClasses = (state: 'top' | 'bottom', e: HTMLElement) => {
        switch (state) {
          case 'bottom':
            e.classList.remove('bottom-edge-shadow');
            e.classList.add('top-edge-shadow');
            break;
          case 'top':
            e.classList.remove('top-edge-shadow');
            e.classList.add('bottom-edge-shadow');
            break;
        }
      };

      scroll$.subscribe(reached => swapClasses(<'top' | 'bottom'>reached, element));
    }
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  onMapClicked(p: L.Point): void {
    this.flowData.coords = p;
  }

  onListToggle(): void {
    this.obsMap.observationMap.invalidateSize();
  }

  @HostListener('document:NewObservationEvent', ['$event'])
  newObservationEventHandler(e: CustomEvent): void {
    e.stopPropagation();
    if (this.observations) {
      this.observations.features.unshift(e.detail);
    }
    this.observations$.next(this.observations);
  }

  onFilterChange(): void {
    this.obsAsFeatureArray$
      .pipe(
        take(1),
        map(observations =>
          compose(
            this.selectedTaxonFilter,
            this.selectedMunicipalityFilter
          )(observations)
        )
        // tap(console.debug)
      )
      .subscribe(observations => {
        this.filteredObservations$.next(observations);
      });
  }
}