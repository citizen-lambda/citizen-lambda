import {
  Component,
  ViewEncapsulation,
  ViewChild,
  AfterViewInit,
  Inject,
  LOCALE_ID,
  HostListener
} from '@angular/core';
import { ActivatedRoute, Router, Params, NavigationExtras, Data } from '@angular/router';
import { combineLatest } from 'rxjs';
import { map, take, takeUntil, pluck } from 'rxjs/operators';

import { Feature } from 'geojson';
import L from 'leaflet';

import { AppConfig } from '@conf/app.config';
import { SeoService } from '@services/seo.service';
import { UnsubscribeOnDestroy } from '@helpers/unsubscribe-on-destroy';
import { ObsMapComponent } from '@shared/observations-shared/map/map.component';
import { ObsListComponent } from '@shared/observations-shared/list/list.component';
import { ModalFlowService } from '@shared/observations-shared/modalflow/modalflow.service';
import { ObservationsFacade } from '@services/observations-facade.service';
import { ConfigModalFlow, ObsPostResponsePayload } from '@models/observation.model';

@Component({
  selector: 'app-observations',
  templateUrl: './obs.component.html',
  encapsulation: ViewEncapsulation.None,
  providers: [ModalFlowService, ObservationsFacade]
})
export class ObsComponent extends UnsubscribeOnDestroy implements AfterViewInit {
  readonly appConfig: ConfigModalFlow = AppConfig;
  AddAnObservationLabel = (this.appConfig.program_add_an_observation as { [name: string]: string })[
    this.localeId.startsWith('fr') ? 'fr' : 'en'
  ];
  @ViewChild(ObsMapComponent) thematicMap!: ObsMapComponent;
  @ViewChild(ObsListComponent) obsList!: ObsListComponent;
  childNavigationExtras: NavigationExtras = { relativeTo: this.route, preserveFragment: true };

  constructor(
    @Inject(LOCALE_ID) public localeId: string,
    protected router: Router,
    protected route: ActivatedRoute,
    protected seo: SeoService,
    public facade: ObservationsFacade,
    public flowService: ModalFlowService
  ) {
    super();
    // test: TypeError: You provided 'undefined' where a stream was expected. You can provide an Observable, Promise, Array, or Iterable.
    combineLatest([this.route.params.pipe(pluck<Params, 'id'>('id')), this.route.data])
      .pipe(
        map(([id]: [number, Data]) => id),
        takeUntil(this.onDestroy$)
      )
      .subscribe(id => {
        this.facade.programId = id;
      });

    this.facade.program$.subscribe(program => {
      this.seo.setMetaTag({
        name: 'description',
        content: program.short_desc
      });
      this.seo.setTitle(`${program.title}`);
    });
  }

  ngAfterViewInit(): void {
    this.thematicMap.click
      .pipe(takeUntil(this.onDestroy$))
      .subscribe((point: L.LatLng) => (this.facade.sharedContext.coords = point));

    combineLatest([this.facade.stream$, this.facade.programId$])
      .pipe(takeUntil(this.onDestroy$))
      .subscribe(
        ([items, programId]) => {
          if (items.length > 0) {
            try {
              const event = JSON.parse(items.toString());
              if (event.program === programId) {
                if (event.NewObservation) {
                  this.facade.onNewObservation(event.NewObservation as ObsPostResponsePayload);
                }
                // …
              }
            } catch (error) {
              console.error(error);
            }
          }
        },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _error => {
          console.debug('SSE: disconnected');
        }
      );
  }

  onListToggle(): void {
    this.thematicMap.observationMap.invalidateSize();
  }

  onObsSelected($event: Feature): void {
    this.facade.selected = $event;
    this.thematicMap.showPopup($event);
  }

  onDetailsRequested($event: number): void {
    this.facade.features$
      .pipe(
        map(features => features.find(feature => feature.properties?.id_observation === $event)),
        take(1)
      )
      .subscribe(feature => {
        if (feature) {
          this.onObsSelected(feature);
        }
      });

    this.router.navigate(['details', $event], this.childNavigationExtras);
  }

  @HostListener('document:ObservationSubmittedEvent', ['$event'])
  newObservationEventHandler(e: CustomEvent): void {
    e.stopPropagation();
    if (this.thematicMap.newObsMarker) {
      // our map needs a service
      this.thematicMap.observationMap.removeLayer(this.thematicMap.newObsMarker);
    }
  }

  /* @HostListener('document:NewObservationEvent', ['$event'])
  newObservationEventHandler(e: CustomEvent): void {
    e.stopPropagation();
    this.facade.onNewObservation(e.detail as Feature);
  } */
}
