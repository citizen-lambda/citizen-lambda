import {
  Injector,
  Component,
  ViewEncapsulation,
  OnInit,
  Input,
  Output,
  ViewChild,
  ElementRef,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
  EventEmitter,
  HostListener,
  ComponentFactoryResolver
} from '@angular/core';

import { FeatureCollection, Feature } from 'geojson';
import L from 'leaflet';
import 'leaflet-gesture-handling';
import 'leaflet-fullscreen';
import 'leaflet.heat';
import 'leaflet.markercluster';
import 'leaflet.locatecontrol';

// import { AppConfig } from "../../../../conf/app.config";
import { MAP_CONFIG } from '../../../../conf/map.config';

declare module 'leaflet' {
  interface MapOptions {
    gestureHandling?: boolean;
  }
}

export const ZoomViewer = L.Control.extend({
  onAdd: (map: L.Map) => {
    const container = L.DomUtil.create('div');
    const gauge = L.DomUtil.create('div');
    container.style.padding = '0 .4em';
    container.style.background = 'rgba(255,255,255,0.5)';
    container.style.textAlign = 'center';
    container.className = 'leaflet-control-zoomviewer';
    map.on('zoomstart zoom zoomend', _e => {
      const z = Math.round(map.getZoom());
      gauge.innerHTML = `<span style="color:${
        z >= MAP_CONFIG.ZOOM_LEVEL_RELEVE ? 'var(--valid)' : 'var(--invalid)'
      };">Zoom: ${z}</span>`;
    });
    container.appendChild(gauge);

    return container;
  }
});

export const conf = {
  MAP_ID: 'obsMap',
  GEOLOCATION_HIGH_ACCURACY: false, // todo: geolocation accuracy should be tunable at runtime
  BASE_LAYERS: MAP_CONFIG['BASEMAPS'].reduce((acc: { [name: string]: L.TileLayer }, baseLayer) => {
    acc[baseLayer['name'].toString()] = L.tileLayer(baseLayer['layer'], {
      attribution: baseLayer['attribution'],
      subdomains: baseLayer['subdomains'] || '',
      maxZoom: baseLayer['maxZoom'],
      bounds: <[number, number][]>baseLayer['bounds']
    });
    return acc;
  }, {}),
  DEFAULT_BASE_MAP: () => {
    return !!MAP_CONFIG['DEFAULT_PROVIDER']
      ? (conf.BASE_LAYERS as { [name: string]: L.TileLayer })[MAP_CONFIG['DEFAULT_PROVIDER']]
      : (conf.BASE_LAYERS as { [name: string]: L.TileLayer })[
          Object.keys(conf.BASE_LAYERS)[
            // tslint:disable-next-line: no-bitwise
            (Math.random() * MAP_CONFIG['BASEMAPS'].length) >> 0
          ]
        ];
  },
  CONTROL_ZOOM_POSITION: 'topright',
  CONTROL_BASE_LAYER_POSITION: 'topright',
  CONTROL_BASE_LAYER_INIT_COLLAPSED: true,
  CONTROL_FULLSCREEN_POSITION: 'topright',
  CONTROL_GEOLOCATION_POSITION: 'topright',
  CONTROL_SCALE_POSITION: 'bottomleft',
  CONTROL_ZOOMVIEW_POSITION: 'bottomleft',
  MARKER_ICON_NEW_OBS: () =>
    L.icon({
      iconUrl: 'assets/pointer-blue2.png',
      iconSize: [33, 42],
      iconAnchor: [16, 42]
    }),
  MARKER_ICON_OBS: () =>
    L.icon({
      iconUrl: 'assets/pointer-green.png',
      iconSize: [33, 42],
      iconAnchor: [16, 42]
    }),
  OBSERVATION_LAYER: () =>
    L.markerClusterGroup({
      iconCreateFunction: clusters => {
        const childCount = clusters.getChildCount();
        return conf.MARKER_ICON_CLUSTER(childCount);
      }
    }),
  MARKER_ICON_CLUSTER: (childCount: number) => {
    // preferences ?
    const qs = 10;
    const qm = 10;
    const quantiles = (count: number) => {
      let c = ' marker-cluster-';
      if (count < qs) {
        c += 'small';
      } else if (count < qm) {
        c += 'medium';
      } else {
        c += 'large';
      }
      return c;
    };
    return new L.DivIcon({
      html: `<div><span>${childCount}</span></div>`,
      className: 'marker-cluster' + quantiles(childCount),
      iconSize: new L.Point(40, 40)
    });
  },
  PROGRAM_AREA_STYLE: (_feature: Feature) => {
    return {
      fillColor: 'transparent',
      weight: 2,
      opacity: 0.8,
      color: 'red',
      dashArray: '4'
    };
  }
};

@Component({
  selector: 'app-obs-map',
  template: `
    <div
      [id]="options.MAP_ID"
      #map
      i18n-data-observation-zoom-statement-warning
      data-observation-zoom-statement-warning="Veuillez zoomer pour localiser votre observation."
    ></div>
  `,
  styleUrls: ['./map.component.css'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ObsMapComponent implements OnInit, OnChanges {
  @ViewChild('map') map!: ElementRef;
  @Input()
  observations!: FeatureCollection;
  @Input()
  program!: FeatureCollection;
  @Output() click: EventEmitter<L.Point> = new EventEmitter();
  options: any;
  observationMap!: L.Map;
  programArea: L.GeoJSON | null = null;
  programMaxBounds!: L.LatLngBounds;
  observationLayer: L.MarkerClusterGroup | null = null;
  heatLayer: L.HeatLayer | null = null;
  newObsMarker: L.Marker | null = null;
  featureMarkers: {
    feature: Feature;
    marker: L.Marker<any>;
  }[] = [];
  obsOnFocus: Feature | null = null;
  shouldOpenAnotherPopup = false;
  zoomAlertTimeout: any;
  layerControl!: L.Control.Layers;

  constructor(private injector: Injector, private resolver: ComponentFactoryResolver) {}

  ngOnInit() {
    this.options = conf;
    console.debug({
      layers: [this.options.DEFAULT_BASE_MAP()], // TODO: add program overlay
      gestureHandling: true
    });
    this.observationMap = L.map(this.map.nativeElement, {
      layers: [this.options.DEFAULT_BASE_MAP()], // TODO: add program overlay
      gestureHandling: true
    });
    this.observationMap.whenReady(() => this.onMapReady());
  }

  ngOnChanges(changes: SimpleChanges) {
    // console.debug(changes);
    if (this.observationMap && changes.program && changes.program.currentValue) {
      this.loadProgramArea();
    }

    if (this.observationMap && changes.observations && changes.observations.currentValue) {
      this.loadObservations();
    }
  }

  onMapReady(): void {
    this.layerControl = L.control
      .layers(this.options.BASE_LAYERS, undefined, {
        collapsed: this.options.CONTROL_BASE_LAYER_INIT_COLLAPSED,
        position: this.options.CONTROL_BASE_LAYER_POSITION
      })
      .addTo(this.observationMap);

    // TODO: handle controls with conf & runtime
    this.observationMap.zoomControl.setPosition(this.options.CONTROL_ZOOM_POSITION);

    (L.control as any)
      ['fullscreen']({
        position: this.options.CONTROL_FULLSCREEN_POSITION,
        title: {
          false: 'View Fullscreen',
          true: 'Exit Fullscreen'
        }
      })
      .addTo(this.observationMap);

    L.control
      .locate({
        position: this.options.CONTROL_GEOLOCATION_POSITION,
        getLocationBounds: (locationEvent: L.LocationEvent) =>
          locationEvent.bounds.extend(this.programMaxBounds),
        locateOptions: {
          enableHighAccuracy: this.options.GEOLOCATION_HIGH_ACCURACY
        }
      })
      .addTo(this.observationMap);

    L.control.scale({ position: this.options.CONTROL_SCALE_POSITION }).addTo(this.observationMap);

    const zv = new ZoomViewer();
    zv.addTo(this.observationMap);
    zv.setPosition(this.options.CONTROL_ZOOMVIEW_POSITION);

    this.observationMap.on('popupclose', event => this.onPopupClose(event));
  }

  loadProgramArea(canSubmit = true): void {
    if (this.newObsMarker) {
      this.observationMap.removeLayer(this.newObsMarker);
    }

    if (this.program) {
      if (this.programArea) {
        this.observationMap.removeLayer(this.programArea);
      }
      this.programArea = L.geoJSON(this.program, {
        style: _feature => this.options.PROGRAM_AREA_STYLE(_feature)
      }).addTo(this.observationMap);

      const programBounds = this.programArea.getBounds();
      this.observationMap.fitBounds(programBounds);
      // this.observationMap.setMaxBounds(programBounds)
      this.newObsMarker = null;

      if (canSubmit) {
        this.programArea.on('click', this.onMark, this);
      }
      this.programMaxBounds = programBounds;
    }
  }

  loadObservations(): void {
    if (this.observations) {
      this.observationMap.whenReady(() => {
        if (this.observationLayer) {
          this.layerControl.removeLayer(this.observationLayer);
          this.observationMap.removeLayer(this.observationLayer);
        }
        this.observationLayer = this.options.OBSERVATION_LAYER() as L.MarkerClusterGroup;

        this.observationLayer.addLayer(L.geoJSON(this.observations, this.layerOptions()));
        this.observationMap.addLayer(this.observationLayer);
        this.layerControl.addOverlay(this.observationLayer, 'points');

        if (this.heatLayer) {
          this.layerControl.removeLayer(this.heatLayer);
          this.observationMap.removeLayer(this.heatLayer);
        }
        this.heatLayer = L.heatLayer(this.featureMarkers.map(item => item.marker.getLatLng()), {
          minOpacity: 0.5
        });
        this.layerControl.addOverlay(this.heatLayer, 'heatmap');
      });
    }
  }

  layerOptions() {
    this.featureMarkers = [];
    const observationLayerOptions: L.GeoJSONOptions = {
      onEachFeature: (feature, layer) => {
        const popupContent = this.getPopupContent(feature);
        layer.bindPopup(popupContent);
      },
      pointToLayer: (feature, latlng): L.Marker => {
        const marker: L.Marker<any> = L.marker(latlng, {
          icon: conf.MARKER_ICON_OBS()
        });
        this.featureMarkers.push({
          // TODO: loose redundant feature field on this.featureMarkers, utilize marker feature
          feature: feature,
          marker: marker
        });
        return marker;
      }
    };

    if (this.observationLayer) {
      // TODO: Add to requirements/docs Leaflet animations must be be enabled.
      this.observationLayer.on('animationend', _e => {
        if (this.obsOnFocus) {
          this.shouldOpenAnotherPopup = true;
          this.observationMap.closePopup();
        }
      });
    }

    return observationLayerOptions;
  }

  getPopupContent(feature: Feature): any {
    // tslint:disable-next-line: no-use-before-declare
    const factory = this.resolver.resolveComponentFactory(MarkerPopupComponent);
    const component = factory.create(this.injector);
    component.instance.data = { ...feature.properties } as TaxonomyListItem & {
      image?: string;
      observer: { username: string };
      date: Date;
    };
    component.changeDetectorRef.detectChanges();
    const popupContent = component.location.nativeElement;
    return popupContent;
  }

  showPopup(obs: Feature, event: L.LeafletEvent): void {
    this.obsOnFocus = obs;
    const marker = this.featureMarkers.find(
      m =>
        (obs.properties &&
          m.feature &&
          m.feature.properties &&
          m.feature.properties.id_observation === obs.properties.id_observation) ||
        false
    );
    let visibleParent: L.Marker | null = null;

    if (this.observationLayer && marker) {
      visibleParent = this.observationLayer.getVisibleParent(marker.marker);
    }
    if (!visibleParent && this.observationLayer && marker) {
      console.debug(event);
      this.observationMap.flyTo(marker.marker.getLatLng(), 16);
      // this.observationMap.panTo(marker.marker.getLatLng());
      visibleParent = marker.marker;
    }
    if (visibleParent) {
      L.popup()
        .setLatLng(visibleParent.getLatLng())
        .setContent(this.getPopupContent(obs))
        .openOn(this.observationMap);
    }
  }

  onPopupClose(event: L.LeafletEvent): void {
    if (this.shouldOpenAnotherPopup && this.obsOnFocus) {
      this.showPopup(this.obsOnFocus, event);
    } else {
      this.obsOnFocus = null;
      this.shouldOpenAnotherPopup = false;
    }
  }

  onMark(event: L.LeafletEvent): void {
    const e = event as L.LeafletMouseEvent;

    if (this.newObsMarker !== null) {
      this.observationMap.removeLayer(this.newObsMarker);
    }

    if (!this.checkMinZoomLevel()) {
      return;
    }

    this.click.emit(L.point(e.latlng.lng, e.latlng.lat));

    this.newObsMarker = L.marker(e.latlng, {
      icon: this.options.MARKER_ICON_NEW_OBS(),
      draggable: true
    }).addTo(this.observationMap);
  }

  checkMinZoomLevel(): boolean {
    const z = this.observationMap.getZoom();

    if (z < MAP_CONFIG.ZOOM_LEVEL_RELEVE) {
      L.DomUtil.addClass(this.observationMap.getContainer(), 'observation-zoom-statement-warning');
      if (this.zoomAlertTimeout) {
        clearTimeout(this.zoomAlertTimeout);
      }
      this.zoomAlertTimeout = setTimeout(() => {
        L.DomUtil.removeClass(
          this.observationMap.getContainer(),
          'observation-zoom-statement-warning'
        );
      }, 1800);
      return false;
    }
    return true;
  }

  @HostListener('document:NewObservationEvent', ['$event'])
  newObservationEventHandler(e: CustomEvent): void {
    e.stopPropagation();
  }
}

import { Taxon } from '../../../api/taxhub.service';
import { PostObservationResponsePayload, TaxonomyListItem } from '../observation.model';

@Component({
  selector: 'app-marker-popup',
  template: `
    <ng-container>
      <img
        [src]="
          data.image
            ? data.image
            : data.medias && !!data.medias.length
            ? data.medias[0].url
            : 'assets/default_taxon.jpg'
        "
      />
      <p>
        <b i18n>{{ data.taxref?.nom_vern }}</b> <br />
        <span i18n>
          Observé par
          {{ data.observer && data.observer.username ? data.observer.username : 'Anonyme' }}
          <br />
          le {{ data.date }}
        </span>
      </p>
      <div class="icon"><img src="assets/binoculars.png" /></div>
    </ng-container>
  `
})
export class MarkerPopupComponent {
  @Input()
  data!: TaxonomyListItem & {
    image?: string;
    observer: { username: string };
    date: Date;
  };
}
