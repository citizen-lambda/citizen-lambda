import {
  Component,
  ViewEncapsulation,
  OnInit,
  OnDestroy,
  ViewChild,
  HostListener,
  Inject,
  LOCALE_ID
} from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import {
  forkJoin,
  combineLatest,
  fromEvent,
  Subject,
  Observable,
  BehaviorSubject
} from "rxjs";
import {
  throttleTime,
  map,
  flatMap,
  filter,
  takeUntil,
  pluck,
  shareReplay,
  share,
  take,
  tap
} from "rxjs/operators";

import { FeatureCollection, Feature } from "geojson";
import * as L from "leaflet";

import { AppConfig } from "../../../conf/app.config";
import { IAppConfig, AnchorNavigation } from "../../core/models";
import { Program } from "../programs.models";
import { ProgramsResolve } from "../../programs/programs-resolve.service";
import { GncProgramsService, sorted } from "../../api/gnc-programs.service";
import { ModalFlowService } from "./modalflow/modalflow.service";
import { TaxonomyList, TaxonomyListItem } from "./observation.model";
import { ObsMapComponent } from "./map/map.component";
import { ObsListComponent } from "./list/list.component";

type AppConfigObservations = Pick<IAppConfig, "platform_participate">;

export const compose = <R>(fn1: (a: R) => R, ...fns: Array<(a: R) => R>) =>
  fns.reduce((prevFn, nextFn) => value => prevFn(nextFn(value)), fn1);

@Component({
  selector: "app-observations",
  templateUrl: "./obs.component.html",
  styleUrls: ["./obs.component.css", "../../home/home.component.css"],
  encapsulation: ViewEncapsulation.None,
  providers: [ProgramsResolve]
})
export class ObsComponent extends AnchorNavigation
  implements OnInit, OnDestroy {
  readonly AppConfig: AppConfigObservations = AppConfig;
  @ViewChild(ObsMapComponent) obsMap: ObsMapComponent;
  @ViewChild(ObsListComponent) obsList: ObsListComponent;
  program: Program;
  programs: Program[];
  programFeature: FeatureCollection;
  observations: FeatureCollection;
  surveySpecies: TaxonomyList;
  flowData: {
    [name: string]: any;
    coords?: L.Point;
    program?: FeatureCollection;
    taxa?: TaxonomyList;
  } = {};
  programID$ = this.route.params.pipe(
    map(params => parseInt(params["id"], 10))
  );
  private unsubscribe$ = new Subject<void>();
  observations$ = new BehaviorSubject<FeatureCollection | null>(null);
  obsAsFeatureArray$: Observable<Feature[]> = this.observations$.pipe(
    filter(collection => !!collection),
    pluck<FeatureCollection, Feature[]>("features"),
    filter(o => !!o),
    takeUntil(this.unsubscribe$),
    shareReplay()
  );
  filteredObservations$ = new BehaviorSubject<Feature[] | null>(null);
  municipalities$ = this.obsAsFeatureArray$.pipe(
    tap(f => console.debug("municipalities$ feature[]", f)),
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
        return [...result.data, result.partials[0]].sort(sorted("name"));
      }
    ),
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
            o.properties.taxref.cd_ref == this.selectedTaxon!.taxref["cd_ref"]
        )
      : obs;
  selectedMunicipalityFilter = (obs: Feature[]): Feature[] =>
    obs && this.selectedMunicipality
      ? obs.filter(
          o =>
            o &&
            o.properties &&
            Object.keys(o.properties) &&
            o.properties.municipality.code == this.selectedMunicipality.code
        )
      : obs;

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
          this.program = data.programs.find(
            (p: Program) => p.id_program === id
          );
          return this.program.id_program;
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
      this.observations = {
        type: "FeatureCollection",
        features: observations!
      };
    });
  }

  ngAfterViewInit(): void {
    // this.obsMap.observationMap.invalidateSize();

    // todo: move
    const element: HTMLElement | null = document.querySelector(
      "#slider .carousel-text div"
    );
    if (element) {
      const scroll$ = fromEvent(element, "scroll").pipe(
        throttleTime(10),
        map(() =>
          element.offsetHeight + element.scrollTop === element.scrollHeight
            ? "bottom"
            : element.scrollTop === 0
            ? "top"
            : null
        ),
        filter(reached => reached !== null),
        takeUntil(this.unsubscribe$)
      );

      const swapClasses = (state: "top" | "bottom", element: HTMLElement) => {
        switch (state) {
          case "bottom":
            element.classList.remove("bottom-edge-shadow");
            element.classList.add("top-edge-shadow");
            break;
          case "top":
            element.classList.remove("top-edge-shadow");
            element.classList.add("bottom-edge-shadow");
            break;
        }
      };

      scroll$.subscribe(reached =>
        swapClasses(<"top" | "bottom">reached, element)
      );
    }
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  onMapClicked(p: L.Point): void {
    this.flowData.coords = p;
  }

  onListToggle() {
    this.obsMap.observationMap.invalidateSize();
  }

  @HostListener("document:NewObservationEvent", ["$event"])
  newObservationEventHandler(e: CustomEvent) {
    e.stopPropagation();
    this.observations.features.unshift(e.detail);
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
