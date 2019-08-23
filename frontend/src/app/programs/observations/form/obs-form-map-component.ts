// tslint:disable: quotemark
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
  OnInit
} from "@angular/core";
import { ValidatorFn, AbstractControl } from "@angular/forms";

import { FeatureCollection, Polygon, MultiPolygon } from "geojson";
import L from "leaflet";
import "leaflet-fullscreen";
import "leaflet-gesture-handling";

// import { AppConfig } from "../../../../conf/app.config";
import { MAP_CONFIG } from "../../../../conf/map.config";

import { conf, ZoomViewer } from "../map/map.component";
import { markerInPolygon } from "./markerInPolygon";

declare let $: any;

export const obsFormMarkerIcon = L.icon({
  iconUrl: "assets/pointer-blue2.png",
  iconSize: [33, 42],
  iconAnchor: [16, 42]
});

export function geometryValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const validGeometry = /Point\(\d{1,3}(|\.\d{1,7}),(|\s)\d{1,3}(|\.\d{1,7})\)$/.test(
      control.value
    );
    return validGeometry ? null : { geometry: { value: control.value } };
  };
}

@Component({
  selector: "app-obs-form-map",
  template: `
    <div
      id="obsFormMap"
      #obsFormMap
      i18n-data-observation-zoom-statement-warning
      data-observation-zoom-statement-warning="Veuillez zoomer pour localiser votre observation."
    ></div>
  `,
  styles: [
    `
      app-obs-form-map {
        height: inherit;
      }
    `,
    `
      app-obs-form-map #obsFormMap {
        position: relative;
        margin: 0;
        padding: 0;
        bottom: 0;
        min-height: 225px;
        width: 100%;
      }
    `,
    `
      .leaflet-control-zoomviewer.leaflet-control {
        margin: 0;
        background: rgba(255, 255, 255, 0.5);
        color: var(--color);
        padding: 0 5px;
        font-size: 0.9em;
      }
    `
  ],
  encapsulation: ViewEncapsulation.None
})
export class ObsFormMapComponent implements OnInit, OnChanges {
  MAP_CONFIG = MAP_CONFIG;
  conf = conf;
  @Input() input: FeatureCollection;
  @Output() output: EventEmitter<{
    coords?: L.Point;
  }> = new EventEmitter();
  @ViewChild("obsFormMap" /*, { static: true }*/) mapRef:
    | ElementRef
    | undefined;
  map!: L.Map;
  options: L.MapOptions = {
    layers: [
      // TODO: troubleshoot this.conf.DEFAULT_BASE_MAP()
      // L.tileLayer(
      //   "https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}",
      //   {
      //     maxZoom: 18,
      //     id: "mapbox.dark",
      //     accessToken:
      //       "pk.eyJ1IjoicGF0a2FwIiwiYSI6ImNqeHpvNWV1MDA0bmozbHBobmhjbWsxODQifQ.jgXkucvmL5kgacz3LwQ4UA"
      //   }
      // )
      L.tileLayer("http://{s}.tile.stamen.com/toner-lite/{z}/{x}/{y}.png", {
        maxZoom: 20,
        attribution: '&copy; <a href="http://maps.stamen.com">Stamen</a>'
      })
    ],
    zoom: 10,
    center: L.latLng({ lat: 44.6041984880559, lng: 4.305528958557883 }),
    gestureHandling: true
  };
  programArea: L.GeoJSON<any> | null = null;
  newObsMarker: L.Marker | null = null;
  program_id: number | undefined;
  zoomAlertTimeout: any;

  constructor() {}

  ngOnInit() {
    // tslint:disable-next-line: no-non-null-assertion
    this.map = L.map(this.mapRef!.nativeElement, this.options);
    this.map.whenReady(() => this.onMapReady());
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.input && changes.input.currentValue) {
      console.debug(changes, this.input);

      if (this.input.features && this.map) {
        this.loadProgramArea(this.input);
      }
      // if (this.input.coords) {
      // TODO: Set initial observation marker from main map if already spotted
      // }
    }
  }

  onMapReady() {
    this.map.zoomControl.setPosition(this.conf
      .CONTROL_ZOOM_POSITION as L.ControlPosition);

    (L.control as any)
      ["fullscreen"]({
        position: "topright",
        title: {
          false: "View Fullscreen",
          true: "Exit Fullscreen"
        }
      })
      .addTo(this.map);

    L.control
      .locate({
        position: this.conf.CONTROL_GEOLOCATION_POSITION,
        getLocationBounds: (locationEvent: L.LocationEvent) =>
          locationEvent.bounds.extend(
            this.programArea
              ? this.programArea.getBounds()
              : (this.options.center as L.LatLng)
          ),
        locateOptions: {
          enableHighAccuracy: this.conf.GEOLOCATION_HIGH_ACCURACY
        }
      })
      .addTo(this.map);

    const zv = new ZoomViewer();
    zv.addTo(this.map);
    zv.setPosition("bottomleft");

    if (this.input.features) {
      this.loadProgramArea(this.input);
    }
  }

  checkZoomHandler(): boolean {
    const z = this.map.getZoom();
    if (z < MAP_CONFIG.ZOOM_LEVEL_RELEVE) {
      L.DomUtil.addClass(
        this.map.getContainer(),
        "observation-zoom-statement-warning"
      );
      if (this.zoomAlertTimeout) {
        clearTimeout(this.zoomAlertTimeout);
      }
      this.zoomAlertTimeout = setTimeout(() => {
        L.DomUtil.removeClass(
          this.map.getContainer(),
          "observation-zoom-statement-warning"
        );
      }, 2000);
      return false;
    }
    return true;
  }

  loadProgramArea(
    data: FeatureCollection,
    removeMarker = true,
    removePrevious = true
  ): void {
    if (this.newObsMarker && removeMarker) {
      this.map.removeLayer(this.newObsMarker);
      this.newObsMarker = null;
    }

    if (removePrevious) {
      if (this.programArea) {
        this.map.removeLayer(this.programArea);
      }
      this.programArea = L.geoJSON(data, {
        style: conf.PROGRAM_AREA_STYLE as L.StyleFunction
      }).addTo(this.map);

      if (this.programArea) {
        this.programArea.on("click", this.programAreaClickHandler, this);
        const maxBounds: L.LatLngBounds = this.programArea.getBounds();
        if (Object.keys(maxBounds)) {
          this.map.flyToBounds(maxBounds.pad(0.01));
        }
      }
    } else {
      if (this.programArea) {
        this.programArea.addData(data);
      }
    }
  }

  programAreaClickHandler(event: L.LeafletMouseEvent) {
    if (this.newObsMarker) {
      this.output.emit({ coords: undefined }); // todo: patch form control value
      this.map.removeLayer(this.newObsMarker);
    }
    const zoomCondition = this.checkZoomHandler();
    if (zoomCondition) {
      this.output.emit({ coords: L.point(event.latlng.lng, event.latlng.lat) });
      this.newObsMarker = L.marker(event.latlng.wrap(), {
        icon: obsFormMarkerIcon,
        draggable: true
      }).addTo(this.map);

      this.newObsMarker.on("dragend", _e => {
        const feature = this.input.features[0];
        const geom = feature.geometry;
        let result = null;
        switch (geom.type) {
          /*
            polygon ring order right hand rule
            - the exterior ring edges are enumerated counterclockwise.
            - interior rings clockwise.
          */
          case "MultiPolygon":
            const polys: {
              outer: L.Polygon;
              inners: L.Polygon[];
            }[][] = geom.coordinates.map(polygons => [
              {
                outer: L.polygon(polygons[0].map(
                  ([lng, lat]: [number, number]) => [lat, lng]
                ) as L.LatLngExpression[]),
                inners: polygons
                  .slice(1)
                  .map(coords =>
                    L.polygon(coords
                      .map(([lng, lat]: [number, number]) => [lat, lng])
                      .reverse() as L.LatLngExpression[])
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

          case "Polygon":
            const [outer, inners] = [
              L.polygon(geom.coordinates[0].map(
                ([lng, lat]: [number, number]) => [lat, lng]
              ) as L.LatLngExpression[]),
              geom.coordinates
                .slice(1)
                .map(coords =>
                  L.polygon((coords.map(([lng, lat]: [number, number]) => [
                    lat,
                    lng
                  ]) as L.LatLngExpression[]).reverse() as L.LatLngExpression[])
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
          alert("Marker is not inside the program area");
          this.output.emit({ coords: undefined }); // todo: patch form control value
          this.map.removeLayer(this.newObsMarker);
          this.newObsMarker = null;
        }
      });
    }
  }
}
