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

import { Program } from '../programs/programs.models';
import { ProgramsResolve } from '../programs/programs-resolve.service';
import { GncProgramsService } from '../programs/gnc-programs.service';
import { TaxonomyService } from '../../services/taxonomy.service';
import { Taxonomy } from '../../core/models';
import { sorted } from '../../helpers/sorted';
import { composeAsync } from '../../helpers/compose';
import { ObsMapComponent } from '../../shared/observations-shared/map/map.component';
import { ObsListComponent } from '../../shared/observations-shared/list/list.component';
import { ModalFlowService } from '../../shared/observations-shared/modalflow/modalflow.service';

@Component({
  selector: 'app-observations',
  templateUrl: './obs.component.html',
  styleUrls: ['./obs.component.css', '../home/home.component.css'],
  encapsulation: ViewEncapsulation.None,
  providers: [ProgramsResolve, ModalFlowService]
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
  taxonomy: Taxonomy | undefined;
  context: {
    [name: string]: any;
    coords?: L.Point;
    program?: FeatureCollection;
    taxa?: Taxonomy;
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
  filteredObservations$ = new BehaviorSubject<Feature[]>([]);
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
  selectedTaxon: string | null = null;
  selectedTaxonFilter = (obs: Feature[]): Feature[] =>
    obs && this.selectedTaxon
      ? obs.filter(
          o =>
            o &&
            o.properties &&
            Object.keys(o.properties).length &&
            // tslint:disable-next-line: no-non-null-assertion
            o.properties.cd_nom === parseInt(this.selectedTaxon!, 10)
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
    protected router: Router,
    private route: ActivatedRoute,
    private programService: GncProgramsService,
    public taxonomyService: TaxonomyService,
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
        this.taxonomy = taxa;
        this.context.taxa = taxa;

        this.context.program = program;
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
    this.obsMap.click.subscribe((point: L.Point) => (this.context.coords = point));
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
          composeAsync(this.selectedTaxonFilter, this.selectedMunicipalityFilter)(observations)
        )
        // tap(console.debug)
      )
      .subscribe(async observations => {
        this.filteredObservations$.next(await observations);
      });
  }
}