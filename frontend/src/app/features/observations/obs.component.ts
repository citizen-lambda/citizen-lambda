import {
  Component,
  ViewEncapsulation,
  OnDestroy,
  ViewChild,
  AfterViewInit,
  Inject,
  LOCALE_ID,
  Injectable,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest, Subject } from 'rxjs';
import { map, takeUntil, take } from 'rxjs/operators';

import { Feature } from 'geojson';
import * as L from 'leaflet';

import { AppConfig } from '../../../conf/app.config';
import { ObsMapComponent } from '../../shared/observations-shared/map/map.component';
import { ObsListComponent } from '../../shared/observations-shared/list/list.component';
import { ModalFlowService } from '../../shared/observations-shared/modalflow/modalflow.service';
import { SeoService } from '../../services/seo.service';
import { ConfigObsFeatures, ConfigModalFlow } from './observation.model';
import { ObservationsFacade } from 'src/app/shared/observations-shared/observations-facade.service';

@Component({
  selector: 'app-observations',
  templateUrl: './obs.component.html',
  styleUrls: ['./obs.component.css', '../home/home.component.css'],
  encapsulation: ViewEncapsulation.None,
  providers: [ModalFlowService, ObservationsFacade],
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
      this.route.params.pipe(map((params) => parseInt(params['id'], 10))),
      this.route.data,
    ])
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(([id, _]) => {
        this.facade.programID = id;
      });

    this.facade.program$.subscribe((program) => {
      this.seo.setMetaTag({
        name: 'description',
        content: program.short_desc,
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
        map((features) =>
          // tslint:disable-next-line: no-non-null-assertion
          features.filter((feature) => feature!.properties!.id_observation === $event)
        ),
        take(1)
      )
      .subscribe((features) => {
        this.onObsSelected(features[0]);
      });
    this.router.navigate(['details', $event], {
      fragment: 'observations',
      relativeTo: this.route,
    });
    // set selected if not already set ?
  }

  /* @HostListener('document:NewObservationEvent', ['$event'])
  newObservationEventHandler(e: CustomEvent): void {
    e.stopPropagation();
    this.facade.onNewObservation(e.detail as Feature);
  } */
}
