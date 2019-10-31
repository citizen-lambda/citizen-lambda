import {
  Component,
  ViewEncapsulation,
  OnDestroy,
  ViewChild,
  HostListener,
  AfterViewInit
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, combineLatest, Subject, Observable, BehaviorSubject } from 'rxjs';
import {
  map,
  flatMap,
  filter,
  takeUntil,
  pluck,
  shareReplay,
  share,
  take,
  switchMap
} from 'rxjs/operators';

import { FeatureCollection, Feature } from 'geojson';
import * as L from 'leaflet';

import { Program } from '../programs.models';
import { ProgramsResolve } from '../../programs/programs-resolve.service';
import { GncProgramsService, sorted } from '../../api/gnc-programs.service';
import { ModalFlowService } from './modalflow/modalflow.service';
import { TaxonomyList, TaxonomyListItem } from './observation.model';
import { ObsMapComponent } from './map/map.component';
import { ObsListComponent } from './list/list.component';

export const compose = <R>(fn1: (a: R) => R, ...fns: Array<(a: R) => R>) =>
  fns.reduce((prevFn, nextFn) => value => prevFn(nextFn(value)), fn1);

@Component({
  selector: 'app-observations',
  templateUrl: './obs.component.html',
  styleUrls: ['./obs.component.css', '../../home/home.component.css'],
  encapsulation: ViewEncapsulation.None,
  providers: [ProgramsResolve]
})
export class ObsComponent implements AfterViewInit, OnDestroy {
  private unsubscribe$ = new Subject<void>();
  @ViewChild(ObsMapComponent)
  obsMap!: ObsMapComponent;
  @ViewChild(ObsListComponent)
  obsList!: ObsListComponent;
  program: Program | undefined;
  programs: Program[] | undefined;
  programFeature: FeatureCollection | undefined;
  observations: FeatureCollection | undefined;
  surveySpecies: TaxonomyList | undefined;
  surveyData: {
    [name: string]: any;
    coords?: L.Point;
    program?: FeatureCollection;
    taxa?: TaxonomyList;
  } = {};
  programID$ = this.route.params.pipe(map(params => parseInt(params['id'], 10)));
  observations$ = new BehaviorSubject<FeatureCollection | undefined>(this.observations);
  obsFeaturesArray$: Observable<Feature[]> = this.observations$.pipe(
    filter(collection => !!collection),
    pluck<FeatureCollection, Feature[]>('features'),
    filter(o => !!o),
    takeUntil(this.unsubscribe$),
    shareReplay()
  );
  filteredObservations$ = new BehaviorSubject<Feature[] | null>(null);
  municipalities$ = this.obsFeaturesArray$.pipe(
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
    obs && this.selectedTaxon
      ? obs.filter(
          o =>
            o &&
            o.properties &&
            Object.keys(o.properties).length &&
            // tslint:disable-next-line: no-non-null-assertion
            o.properties.taxref.cd_ref === this.selectedTaxon!.cd_ref
        )
      : obs;
  selectedMunicipalityFilter = (obs: Feature[]): Feature[] =>
    obs && this.selectedMunicipality
      ? obs.filter(
          o =>
            o &&
            o.properties &&
            Object.keys(o.properties) &&
            o.properties.municipality.code === this.selectedMunicipality.code
        )
      : obs;

  constructor(
    protected router: Router,
    protected route: ActivatedRoute,
    private programService: GncProgramsService,
    public flowService: ModalFlowService
  ) {
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
        this.surveyData.taxa = taxa;

        this.surveyData.program = program;
      });

    this.programID$
      .pipe(
        takeUntil(this.unsubscribe$),
        switchMap(id => this.programService.getProgramObservations(id))
      )
      .subscribe(observations => {
        this.observations = observations;
        this.observations$.next(this.observations);
      });
  }

  ngAfterViewInit() {
    this.obsFeaturesArray$.subscribe(o => this.filteredObservations$.next(o));
    this.obsMap.click.subscribe((point: L.Point) => (this.surveyData.coords = point));
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  onListToggle(): void {
    this.obsMap.observationMap.invalidateSize();
  }

  @HostListener('document:NewObservationEvent', ['$event'])
  newObservationEventHandler(e: CustomEvent): void {
    e.stopPropagation();
    if (this.observations) {
      this.observations.features = [e.detail as Feature, ...this.observations.features];
      this.observations$.next(this.observations);
    }
  }

  onFilterChange(): void {
    this.obsFeaturesArray$
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
