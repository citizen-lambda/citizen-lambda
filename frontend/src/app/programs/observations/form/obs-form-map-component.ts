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

import L from "leaflet";
import "leaflet-fullscreen";
import "leaflet-gesture-handling";

// import { AppConfig } from "../../../../conf/app.config";
import { MAP_CONFIG } from "../../../../conf/map.config";
import { FeatureCollection } from "geojson";

import { conf } from "../map/map.component";

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
  @Input("input") input!: FeatureCollection;
  @Output("onClick") output: EventEmitter<{
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
    center: L.latLng(44.6041984880559, 4.305528958557883),
    gestureHandling: true
    // fullscreenControl: true,
    // fullscreenControlOptions: {
    //   position: "topleft"
    // }
  };
  programArea: L.GeoJSON<any> | null = null;
  newObsMarker: L.Marker | null = null;
  program_id: number | undefined;
  zoomAlertTimeout: any;

  constructor() {}

  ngOnInit() {
    this.map = L.map(this.mapRef!.nativeElement, this.options);
    this.map.whenReady(() => this.onMapReady());
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.input && changes.input.currentValue) {
      console.debug(changes, this.input);

      if (this.input!.features && this.map) {
        this.loadProgramArea(this.input!);
      }
      // if (this.input.coords) {
      //   // Set initial observation marker from main map if already spotted
      // }
    }
  }

  onMapReady() {
    this.map.zoomControl.setPosition(this.conf
      .ZOOM_CONTROL_POSITION as L.ControlPosition);

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
        position: this.conf.GEOLOCATION_CONTROL_POSITION,
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

    let ZoomViewer = L.Control.extend({
      onAdd: () => {
        let container = L.DomUtil.create("div");
        let gauge = L.DomUtil.create("div");
        container.className = "leaflet-control-zoomviewer";
        this.map.on("zoomstart zoom zoomend", _e => {
          gauge.innerHTML = "Zoom: " + this.map.getZoom();
        });
        container.appendChild(gauge);

        return container;
      }
    });
    let zv = new ZoomViewer();
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
    console.debug("loading area:", data);
    /*

    Points "coordinates": [0, 0]
    MultiPoints & LineStrings "coordinates": [[0, 0], [1, 0]]
    MultiLineStrings & Polygons "coordinates": [[[0, 0], [10, 10], [10, 0], [0, 0]]]
    MultiPolygons

    - Polygon
      - LinearRing (exterior)
        - Positions..
      - LinearRing (interior)
        - Positions...
      - LinearRing (interior)
        - Positions...

    {
      "type": "Feature",
      "geometry": {
        "type": "GeometryCollection",
        "geometries": [{
          "type": "Point",
          "coordinates": [0, 0]
        }, {
          "type": "LineString",
          "coordinates": [[0, 0], [1, 0]]
        }]
      },
      "properties": {
        "name": "null island"
      }
    }

    Polygon ring order: the right hand rule
      - The exterior ring should be counterclockwise.
      - Interior rings should be clockwise.

    Strategy:
    if geojson.type.FeatureCollection
      => load program areas
      => and observation markers
    if FeatureCollection count == 1 => load program areas and delay observation data
    fetch until area painted.
    */
    if (removeMarker && this.newObsMarker) {
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
    console.debug("programAeraClickHandler:", event);
    if (this.newObsMarker) {
      this.output.emit({ coords: undefined }); // todo: patch form control value
      this.map.removeLayer(this.newObsMarker);
    }
    const zoomCondition = this.checkZoomHandler();
    if (zoomCondition) {
      this.output.emit({ coords: L.point(event.latlng.lng, event.latlng.lat) });
      this.newObsMarker = L.marker(event.latlng, {
        icon: obsFormMarkerIcon,
        draggable: true // FIXME: marker can be dragged outside programArea
      }).addTo(this.map);

      this.newObsMarker.on("dragend", _e => {
        const feature = this.input.features[0];
        const geom = feature.geometry;
        let polygon: any;
        switch (geom.type) {
          case "MultiPolygon":
            polygon = L.polygon(geom.coordinates as L.LatLngExpression[][][]);
            break;
          case "Polygon":
            polygon = L.polygon(geom.coordinates as L.LatLngExpression[][]);
            break;
          default:
            alert(`${geom.type} has no handler`);
        }
        if (
          this.newObsMarker &&
          !this.isMarkerInsidePolygon(this.newObsMarker, polygon)
        ) {
          alert("Marker is not inside the program area");
          this.output.emit({ coords: undefined }); // todo: patch form control value
          this.map.removeLayer(this.newObsMarker);
          this.newObsMarker = null;
        }
      });
    }
  }

  updateMarkerLatLng(lat: number, lng: number) {
    // this.newObsMarker.setLatLng([lat, lng]);
    this.map.panTo([lat, lng]);
  }

  isMarkerInsidePolygon(marker: L.Marker, polygon: L.Polygon) {
    /*
      https://en.wikipedia.org/wiki/Point_in_polygon#cite_note-6
      http://geomalgorithms.com/a03-_inclusion.html
      TODO: recommendation to follow "the right hand rule",
      ... meaning the outer polygon is enumerated counterclockwise
      while the inner polygons clockwise.
      cf https://tools.ietf.org/html/rfc7946#section-3.1.6
      also, setup a test bench for this implementation!
    */
    let V: L.Point[] = [];
    for (let polylines of polygon.getLatLngs()) {
      for (let edges of polylines) {
        for (let p of edges) {
          V.push(L.point(p.lat, p.lng));
        }
        V.push(
          L.point((edges as L.LatLng[])[0].lat, (edges as L.LatLng[])[0].lng)
        );
      }
    }
    const isLeft = (P0: L.Point, P1: L.Point, P2: L.Point) =>
      (P1.x - P0.x) * (P2.y - P0.y) - (P2.x - P0.x) * (P1.y - P0.y);
    // inverted ?!
    const P = L.point(marker.getLatLng().lng, marker.getLatLng().lat);
    const n = V.length - 1;
    let wn = 0;

    for (let i = 0; i < n; i++) {
      if (V[i + 1].y <= P.y) {
        if (V[i].y > P.y) {
          if (isLeft(V[i + 1], V[i], P) > 0) {
            wn++;
          }
        }
      } else {
        if (V[i].y <= P.y) {
          if (isLeft(V[i + 1], V[i], P) < 0) {
            wn--;
          }
        }
      }
    }
    console.debug(wn);
    return wn > 0;
  }
}
