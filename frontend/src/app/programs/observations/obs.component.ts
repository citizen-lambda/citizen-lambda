import {
  Component,
  ViewEncapsulation,
  ViewChild,
  HostListener,
  Inject,
  LOCALE_ID
} from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { forkJoin, combineLatest } from "rxjs";
import { map, flatMap } from "rxjs/operators";

import { FeatureCollection } from "geojson";
import * as L from "leaflet";

import { AppConfig } from "../../../conf/app.config";
import { IAppConfig, AnchorNavigation } from "../../core/models";
import { Program } from "../programs.models";
import { ProgramsResolve } from "../../programs/programs-resolve.service";
import { GncProgramsService } from "../../api/gnc-programs.service";
import { ModalFlowService } from "./modalflow/modalflow.service";
import { TaxonomyList } from "./observation.model";
import { ObsMapComponent } from "./map/map.component";
import { ObsListComponent } from "./list/list.component";

type AppConfigObservations = Pick<IAppConfig, "platform_participate">;

@Component({
  selector: "app-observations",
  templateUrl: "./obs.component.html",
  styleUrls: ["./obs.component.css", "../../home/home.component.css"],
  encapsulation: ViewEncapsulation.None,
  providers: [ProgramsResolve]
})
export class ObsComponent extends AnchorNavigation {
  readonly AppConfig: AppConfigObservations = AppConfig;
  programs: Program[];
  program: Program;
  data: {
    [name: string]: any;
    coords?: L.Point;
    program?: FeatureCollection;
    taxa?: TaxonomyList;
  } = {};
  observations: FeatureCollection;
  programFeature: FeatureCollection;
  surveySpecies: TaxonomyList;
  @ViewChild(ObsMapComponent) obsMap: ObsMapComponent;
  @ViewChild(ObsListComponent) obsList: ObsListComponent;

  constructor(
    @Inject(LOCALE_ID) readonly localeId: string,
    protected router: Router,
    protected route: ActivatedRoute,
    private programService: GncProgramsService,
    public flowService: ModalFlowService
  ) {
    super(router, route);
    combineLatest(this.route.params, this.route.data)
      .pipe(
        map(([params, data]) => {
          const program_id: number = parseInt(params["id"]);
          this.programs = data.programs;
          this.program = data.programs.find(
            (p: Program) => p.id_program === program_id
          );
          return this.program.id_program;
        }),
        flatMap(program_id =>
          forkJoin([
            // TODO: potentially expensive ... defer loading obs set until first paint.
            this.programService.getProgramObservations(program_id),
            this.programService.getProgramTaxonomyList(program_id),
            this.programService.getProgram(program_id)
          ])
        )
      )
      .subscribe(([observations, taxa, program]) => {
        this.observations = observations;
        this.surveySpecies = taxa;
        this.programFeature = program;
        this.data.taxa = taxa;
        this.data.program = program;
      });
  }

  // onInit(): void {}
  // afterViewInit(): void {}

  onMapClicked(p: L.Point): void {
    this.data.coords = p;
  }

  onListToggle() {
    this.obsMap.observationMap.invalidateSize();
  }

  @HostListener("document:NewObservationEvent", ["$event"])
  newObservationEventHandler(e: CustomEvent) {
    e.stopPropagation();
    this.observations.features.unshift(e.detail);
    this.observations = {
      type: "FeatureCollection",
      features: this.observations.features
    };
    this.obsList.observations = {
      type: "FeatureCollection",
      features: this.observations.features
    };
  }

  @HostListener("document:ObservationFilterEvent", ["$event"])
  observationFilterEventHandler(e: CustomEvent) {
    e.stopPropagation();
    this.obsList.observations = {
      type: "FeatureCollection",
      features: this.observations.features
    };
  }
}
