/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  Component,
  ViewEncapsulation,
  OnChanges,
  Input,
  Output,
  EventEmitter,
  SimpleChanges,
  ElementRef,
  ViewChild,
  OnInit,
  ChangeDetectionStrategy
} from '@angular/core';
import { ValidatorFn, AbstractControl, FormGroup, FormControl } from '@angular/forms';

import { FeatureCollection } from 'geojson';
import L from 'leaflet';
import 'leaflet-fullscreen';
import 'leaflet-gesture-handling';

// import { AppConfig } from "@conf/app.config";
import { MAP_CONFIG } from '@conf/map.config';

import { conf, ZoomViewer } from '@shared/observations-shared/map/map.component';
import { markerInPolygon } from './markerInPolygon';

export const obsFormMarkerIcon = L.icon({
  iconUrl: 'assets/marker-blue.svg',
  iconSize: [33, 42],
  iconAnchor: [16, 42]
});

// hotfix
const BASE_LAYERS = MAP_CONFIG.BASEMAPS.reduce(
  (acc: { [name: string]: L.TileLayer }, baseLayer) => {
    acc[baseLayer.name.toString()] = L.tileLayer(baseLayer.layer, {
      attribution: baseLayer.attribution,
      subdomains: baseLayer.subdomains || '',
      maxZoom: baseLayer.maxZoom
      // bounds?: <[number, number][]>baseLayer['bounds']
    });
    return acc as { [name: string]: L.TileLayer };
  },
  {}
);
const DEFAULT_BASE_MAP = (): L.TileLayer => BASE_LAYERS[MAP_CONFIG.DEFAULT_PROVIDER];

export function geometryValidator(): ValidatorFn {
  return (control: AbstractControl): { geometry: { value: AbstractControl['value'] } } | null => {
    let validPoint = false;
    // NTM: Point -90 < lat < +90 && -180 < lon < 180, 7 decimal places is cm precision
    if (/^LatLng\(\d{1,3}(|\.\d{1,7}),(|\s)\d{1,3}(|\.\d{1,7})\)$/.test(control.value)) {
      try {
        const validLatLng = new L.LatLng(control.value.lat, control.value.lng);
        validPoint = validLatLng ? true : false;
      } catch (error) {
        console.error('geometryValidator:', error);
        return { geometry: { value: control.value } };
      }
    }
    return !validPoint ? { geometry: { value: control.value } } : null;
  };
}

@Component({
  selector: 'app-obs-form-map',
  templateUrl: './map.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FormMapComponent implements OnInit, OnChanges {
  MapConfig = MAP_CONFIG;
  @Input() parentForm: FormGroup | undefined;
  @Input() hasZoomAlert: boolean | undefined;
  @Input() coords?: L.LatLng | undefined;
  @Input() program!: FeatureCollection;
  @Output() output: EventEmitter<{
    coords?: L.LatLng;
  }> = new EventEmitter();
  @ViewChild('obsFormMap', { static: true }) mapRef!: ElementRef;
  @ViewChild('geometry') geometryInput: ElementRef<HTMLInputElement> | undefined;
  map!: L.Map;
  options: L.MapOptions = {
    layers: [DEFAULT_BASE_MAP() as L.TileLayer],
    zoom: 10,
    center: L.latLng({ lat: 44.604198, lng: 4.305529 }),
    gestureHandling: true
  };
  programPolygon: L.GeoJSON<object> | undefined;
  newObsMarker: L.Marker | undefined;
  programId: number | undefined;
  zoomAlertTimeout: number | undefined;
  geometry = new FormControl({
    geometry: [this.coords, geometryValidator()]
  });

  // TODO: add a delete marker control

  ngOnInit(): void {
    this.map = L.map(this.mapRef?.nativeElement, this.options);
    this.map.whenReady(() => this.onMapReady());
    this.parentForm?.addControl('geometry', this.geometry);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.program && changes.program.currentValue) {
      if (this.program.features && this.map) {
        this.loadPolygon(this.program);
      }
    }
    if (changes.coords.currentValue && !changes.coords.firstChange && this.coords != null) {
      // FIXME: FULL UPDATE WITH MARKER CREATION
      this.geometry.setValue({ geometry: this.coords });
      this.output.emit({
        coords: L.latLng(this.coords)
      });
      this.addMarker(L.latLng(this.coords));
    }
  }

  onMapReady(): void {
    this.map.zoomControl.setPosition(conf.CONTROL_ZOOM_POSITION as L.ControlPosition);

    L.control
      .fullscreen({
        position: 'topright',
        title: {
          false: 'View Fullscreen',
          true: 'Exit Fullscreen'
        }
      })
      .addTo(this.map);

    L.control
      .locate({
        position: conf.CONTROL_GEOLOCATION_POSITION,
        getLocationBounds: (locationEvent: L.LocationEvent) =>
          locationEvent.bounds.extend(
            this.programPolygon
              ? this.programPolygon.getBounds()
              : (this.options.center as L.LatLng)
          ),
        locateOptions: {
          enableHighAccuracy: conf.GEOLOCATION_HIGH_ACCURACY
        }
      })
      .addTo(this.map);

    const zv = new ZoomViewer();
    zv.addTo(this.map);
    zv.setPosition('bottomleft');

    if (this.program.features) {
      this.loadPolygon(this.program);
    }

    if (this.coords) {
      // FIXME: FULL UPDATE WITH MARKER  CREATION
      this.geometry.setValue({ geometry: this.coords });
      this.output.emit({
        coords: L.latLng(this.coords)
      });
      this.addMarker(L.latLng(this.coords));
    }
  }

  checkZoomHandler(): boolean {
    const z = this.map.getZoom();
    if (z < this.MapConfig.ZOOM_LEVEL_RELEVE) {
      L.DomUtil.addClass(this.map.getContainer(), 'observation-zoom-statement-warning');
      if (this.zoomAlertTimeout) {
        window.clearTimeout(this.zoomAlertTimeout);
      }
      this.zoomAlertTimeout = window.setTimeout(() => {
        L.DomUtil.removeClass(this.map.getContainer(), 'observation-zoom-statement-warning');
      }, 2000);
      return false;
    }
    return true;
  }

  loadPolygon(data: FeatureCollection, removeMarker = true, removePrevious = true): void {
    if (this.newObsMarker && removeMarker) {
      // FIXME: FULL UPDATE WITH MAKER DELETION
      this.geometry.setValue({ geometry: undefined });
      this.output.emit({ coords: undefined });
      this.map.removeLayer(this.newObsMarker);

      this.newObsMarker = undefined;
    }

    if (removePrevious) {
      if (this.programPolygon) {
        this.map.removeLayer(this.programPolygon);
      }
      this.programPolygon = L.geoJSON(data, {
        style: conf.PROGRAM_AREA_STYLE as L.StyleFunction
      }).addTo(this.map);

      if (this.programPolygon) {
        this.programPolygon.on('click', this.programPolygonClickHandler, this);
        const maxBounds: L.LatLngBounds = this.programPolygon.getBounds();
        if (Object.keys(maxBounds)) {
          this.map.flyToBounds(maxBounds.pad(0.01));
        }
      }
    } else {
      if (this.programPolygon) {
        this.programPolygon.addData(data);
      }
    }
  }

  programPolygonClickHandler(event: L.LeafletEvent): void {
    if (this.newObsMarker) {
      // FIXME: FULL UPDATE WITH MAKER DELETION
      this.geometry.setValue({ geometry: undefined });
      this.output.emit({ coords: undefined });
      this.map.removeLayer(this.newObsMarker);

      this.newObsMarker = undefined;
    }
    const zoomCondition = this.checkZoomHandler();
    if (zoomCondition) {
      const e = event as L.LeafletMouseEvent;
      // FIXME: FULL UPDATE WITH MARKER CREATION
      this.geometry.setValue({ geometry: e.latlng });
      this.output.emit({
        coords: L.latLng(e.latlng)
      });
      this.addMarker(e.latlng);
    }
  }

  addMarker(latLng: L.LatLng): void {
    this.newObsMarker = L.marker(latLng, {
      icon: obsFormMarkerIcon,
      draggable: true
    }).addTo(this.map);

    this.newObsMarker.on('dragend', () => {
      const feature = this.program.features[0];
      const geom = feature.geometry;
      let result = null;
      switch (geom.type) {
        /*
          polygon ring order right hand rule
          - the exterior ring edges are enumerated counterclockwise.
          - interior rings clockwise.
        */
        case 'MultiPolygon':
          // eslint-disable-next-line no-case-declarations
          const polys: {
            outer: L.Polygon;
            inners: L.Polygon[];
          }[][] = geom.coordinates.map(polygons => [
            {
              outer: L.polygon(
                (polygons[0] as [number, number][]).map(([lng, lat]: [number, number]) => [
                  lat,
                  lng
                ]) as L.LatLngExpression[]
              ),
              inners: polygons
                .slice(1)
                .map(coords =>
                  L.polygon(
                    (coords as [number, number][])
                      .map(([lng, lat]: [number, number]) => [lat, lng])
                      .reverse() as L.LatLngExpression[]
                  )
                )
            }
          ]);

          if (this.newObsMarker) {
            result = polys.some(p =>
              p.some(
                poly =>
                  // tslint:disable-next-line: no-non-null-assertion
                  markerInPolygon(this.newObsMarker!)(poly.outer) &&
                  // tslint:disable-next-line: no-non-null-assertion
                  !poly.inners.some(markerInPolygon(this.newObsMarker!))
              )
            );
          }
          break;

        case 'Polygon':
          // eslint-disable-next-line no-case-declarations
          const [outer, inners] = [
            L.polygon(
              (geom.coordinates[0] as [number, number][]).map(([lng, lat]) => [
                lat,
                lng
              ]) as L.LatLngExpression[]
            ),
            geom.coordinates
              .slice(1)
              .map(coords =>
                L.polygon(
                  ((coords as [number, number][]).map(([lng, lat]) => [
                    lat,
                    lng
                  ]) as L.LatLngExpression[]).reverse() as L.LatLngExpression[]
                )
              )
          ];
          if (this.newObsMarker) {
            result =
              markerInPolygon(this.newObsMarker)(outer) &&
              !inners.some(markerInPolygon(this.newObsMarker));
          }
          break;

        default:
          alert(`${geom.type} has no handler`);
      }
      if (this.newObsMarker && result === false) {
        alert('The marker is not in the program area!');
        // FIXME: FULL UPDATE WITH MARKER DELETION
        this.geometry.setValue({ geometry: undefined });
        this.output.emit({ coords: undefined });
        this.map.removeLayer(this.newObsMarker);

        this.newObsMarker = undefined;
      }
      if (this.newObsMarker && result === true) {
        // FIXME: PARTIAL UPDATE
        this.geometry.setValue({ geometry: this.newObsMarker.getLatLng() });
        this.output.emit({
          coords: this.newObsMarker.getLatLng()
        });
      }
    });
  }
}
