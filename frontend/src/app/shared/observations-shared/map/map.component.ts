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
  ComponentFactoryResolver,
  ComponentRef
} from '@angular/core';

import { FeatureCollection, Feature } from 'geojson';
import L from 'leaflet';
import 'leaflet-gesture-handling';
import 'leaflet-fullscreen';
import 'leaflet.heat';
import 'leaflet.markercluster';
import 'leaflet.locatecontrol';
import localForage from 'localforage';
import 'leaflet-offline';

import { MAP_CONFIG } from '../../../../conf/map.config';
import { Taxonomy, Taxon } from '../../../core/models';
import { ObservationData } from '../../../features/observations/observation.model';
import { MarkerPopupComponent } from './marker-popup.component';

declare module 'leaflet' {
  interface MapOptions {
    gestureHandling?: boolean;
  }
  export class TileLayerOffline extends L.TileLayer {
    constructor(urlTemplate: string, tilesDb: Object, options?: L.TileLayerOptions);
    initialize(url: String, tilesDb: Object, options: Object): void;
    createTile(coords: Object, done: Function): HTMLElement;
    getTileUrl(coords: Object): String;
    getTileUrls(bounds: Object, zoom: Number): Array<any>;
  }
  // export function tileLayer(urlTemplate: string, options?: L.TileLayerOptions): L.TileLayer;
  export namespace tileLayer {
    function offline(url: String, tilesDb: Object, options: Object): TileLayerOffline;
    /* export class Offline extends L.TileLayer {
      constructor(urlTemplate: string, tilesDb: Object, options?: L.TileLayerOptions);
      initialize(url: String, tilesDb: Object, options: Object): void;
      createTile(coords: Object, done: Function): HTMLElement;
      getTileUrl(coords: Object): String;
      getTileUrls(bounds: Object, zoom: Number): Array<any>;
    } */
  }
  export class ControlOffline extends L.Control {
    constructor(baseLayer: Object, tilesDb: Object, options: Object);
    initialize(baseLayer: Object, tilesDb: Object, options: Object): void;
    onAdd(map: Object): HTMLElement;
  }
  namespace Control {
    interface LocateOptions {
      getLocationBounds?: Function;
    }
  }
  export function control(): L.ControlOffline;
  export namespace control {
    function offline(baseLayer: Object, tilesDb: Object, options: Object): ControlOffline;
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

export const tilesDb = {
  getItem: function(key: string) {
    return localForage.getItem(key);
  },

  saveTiles: function(tileUrls: { key: string; url: string }[]) {
    const self = this;

    const promises = [];

    for (let i = 0; i < tileUrls.length; i++) {
      const tileUrl = tileUrls[i];
      promises[i] = new Promise(function(resolve, reject) {
        const request = new XMLHttpRequest();
        request.open('GET', tileUrl.url, true);
        request.responseType = 'blob';
        request.onreadystatechange = function() {
          if (request.readyState === XMLHttpRequest.DONE) {
            if (request.status === 200) {
              resolve(self._saveTile(tileUrl.key, request.response));
            } else {
              reject({
                status: request.status,
                statusText: request.statusText
              });
            }
          }
        };
        request.send();
      });
    }

    return Promise.all(promises);
  },

  clear: function() {
    return localForage.clear();
  },

  _saveTile: function(key: string, value: any) {
    return this._removeItem(key).then(function() {
      return localForage.setItem(key, value);
    });
  },

  _removeItem: function(key: string) {
    return localForage.removeItem(key);
  }
};

export const conf = {
  MAP_ID: 'thematicMap',
  GEOLOCATION_HIGH_ACCURACY: false, // TODO: geolocation accuracy should be tunable at runtime
  BASE_LAYERS: MAP_CONFIG['BASEMAPS'].reduce((acc: { [name: string]: L.TileLayer }, baseLayer) => {
    acc[baseLayer['name'].toString()] = L.tileLayer(baseLayer['layer'], {
      attribution: baseLayer['attribution'],
      subdomains: baseLayer['subdomains'] || '',
      maxZoom: baseLayer['maxZoom']
      // bounds?: <[number, number][]>baseLayer['bounds']
    }) as any;
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
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ObsMapComponent implements OnInit, OnChanges {
  @ViewChild('map', { static: true }) map!: ElementRef;
  @Input() observations!: FeatureCollection;
  @Input() taxonomy!: Taxonomy;
  @Input() program!: FeatureCollection;
  @Output() click: EventEmitter<L.Point> = new EventEmitter();
  @Output() obsSelected: EventEmitter<Feature> = new EventEmitter();
  @Output() detailsRequested: EventEmitter<Feature> = new EventEmitter();
  options: any;
  layerControl!: L.Control.Layers;
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
  zoomAlertTimeout: any;
  popupRef?: ComponentRef<MarkerPopupComponent>;

  constructor(private injector: Injector, private resolver: ComponentFactoryResolver) {}

  ngOnInit() {
    this.options = conf;
    this.observationMap = L.map(this.map.nativeElement, {
      layers: [this.options.DEFAULT_BASE_MAP()], // TODO: add program overlay
      gestureHandling: true
    });
    this.observationMap.whenReady(() => this.onMapReady());
  }

  ngOnChanges(changes: SimpleChanges) {
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

    const offlineLayer = L.tileLayer.offline(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      tilesDb,
      {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        subdomains: 'abc',
        minZoom: 13,
        maxZoom: 20,
        crossOrigin: true,
        name: 'offline'
      }
    );

    const offlineControl = L.control.offline(offlineLayer, tilesDb, {
      saveButtonHtml: '<i class="fa fa-download" aria-hidden="true"></i>',
      removeButtonHtml: '<i class="fa fa-trash" aria-hidden="true"></i>',
      confirmSavingCallback: function(nTilesToSave: number, continueSaveTiles: Function) {
        if (window.confirm('Save ' + nTilesToSave + '?')) {
          continueSaveTiles();
        }
      },
      confirmRemovalCallback: function(continueRemoveTiles: Function) {
        if (window.confirm('Remove all the tiles?')) {
          continueRemoveTiles();
        }
      },
      minZoom: 13,
      maxZoom: 19
    });

    offlineLayer.addTo(this.observationMap);
    offlineControl.addTo(this.observationMap);

    offlineLayer.on('offline:below-min-zoom-error', function() {
      alert('Can not save tiles below minimum zoom level.');
    });

    offlineLayer.on('offline:save-start', function(data) {
      console.log(
        'Saving ' + (data as L.LeafletEvent & { nTilesToSave: number }).nTilesToSave + ' tiles.'
      );
    });

    offlineLayer.on('offline:save-end', function() {
      alert('All the tiles were saved.');
    });

    offlineLayer.on('offline:save-error', function(err) {
      console.error('Error when saving tiles: ' + err);
    });

    offlineLayer.on('offline:remove-start', function() {
      console.log('Removing tiles.');
    });

    offlineLayer.on('offline:remove-end', function() {
      alert('All the tiles were removed.');
    });

    offlineLayer.on('offline:remove-error', function(err) {
      console.error('Error when removing tiles: ' + err);
    });
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
      this.observationMap.fitBounds(programBounds, { maxZoom: this.observationMap.getMaxZoom() });
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
        this.heatLayer = L.heatLayer(
          this.featureMarkers.map(item => item.marker.getLatLng()),
          {
            minOpacity: 0.5
          }
        );
        this.layerControl.addOverlay(this.heatLayer, 'heatmap');
      });
    }
  }

  layerOptions() {
    this.featureMarkers = [];
    const observationLayerOptions: L.GeoJSONOptions = {
      // onEachFeature: (feature, layer) => {},
      pointToLayer: (feature, latlng): L.Marker => {
        const marker: L.Marker<any> = L.marker(latlng, {
          icon: conf.MARKER_ICON_OBS()
        });
        marker.on('click', _ => {
          this.obsSelected.emit(feature);
          this.showPopup(feature);
        });
        this.featureMarkers.push({
          // TODO: simplify marker collection refs handling
          feature: feature,
          marker: marker
        });
        return marker;
      }
    };

    return observationLayerOptions;
  }

  getPopupContent(feature: Feature): any {
    if (this.popupRef) {
      this.popupRef.destroy();
      console.debug('destroyed popup');
    }
    console.debug('creating popup');
    // tslint:disable-next-line: no-use-before-declare
    const factory = this.resolver.resolveComponentFactory(MarkerPopupComponent);
    const component = factory.create(this.injector);
    component.instance.data = { ...feature.properties } as Taxon & Partial<ObservationData>;
    component.instance.detailsRequest.subscribe((data: any) => this.detailsRequested.emit(data));
    component.changeDetectorRef.detectChanges();
    this.popupRef = component;
    return this.popupRef.location.nativeElement;
  }

  showPopup(obs: Feature): void {
    this.obsOnFocus = obs;
    const marker = this.featureMarkers.find(
      // tslint:disable-next-line: no-non-null-assertion
      m => m.feature.properties!.id_observation === obs.properties!.id_observation || undefined
    );
    // console.debug(obs, marker, event);
    let visibleParent: L.Marker | null = null;

    if (this.observationLayer && marker) {
      visibleParent = this.observationLayer.getVisibleParent(marker.marker);

      if (!visibleParent) {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          this.observationMap.panTo(marker.marker.getLatLng());
        } else {
          this.observationMap.flyTo(marker.marker.getLatLng(), 19);
        }
        visibleParent = marker.marker;
      }

      this.observationMap.openPopup(this.getPopupContent(obs), visibleParent.getLatLng());
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
