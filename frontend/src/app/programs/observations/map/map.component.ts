import {
  Component,
  ViewEncapsulation,
  OnInit,
  Input,
  Output,
  OnChanges,
  SimpleChanges,
  EventEmitter,
  ViewChild,
  ElementRef,
  HostListener,
  ComponentFactoryResolver,
  Injector
} from "@angular/core";

import { FeatureCollection, Feature } from "geojson";
import L from "leaflet";
import "leaflet-gesture-handling";
import "leaflet.fullscreen";
import "leaflet.heat";
import "leaflet.markercluster";
import "leaflet.locatecontrol";

// import { AppConfig } from "../../../../conf/app.config";
import { MAP_CONFIG } from "../../../../conf/map.config";

export const conf = {
  MAP_ID: "obsMap",
  GEOLOCATION_HIGH_ACCURACY: false,
  BASE_LAYERS: MAP_CONFIG["BASEMAPS"].reduce(
    (acc: { [name: string]: L.TileLayer }, baseLayer) => {
      acc[baseLayer["name"].toString()] = L.tileLayer(baseLayer["layer"], {
        // name: baseLayer["name"],
        attribution: baseLayer["attribution"],
        subdomains: baseLayer["subdomains"] || "",
        maxZoom: baseLayer["maxZoom"],
        bounds: <[number, number][]>baseLayer["bounds"]
      });
      return acc;
    },
    {}
  ),
  DEFAULT_BASE_MAP: () => {
    return !!MAP_CONFIG["DEFAULT_PROVIDER"]
      ? (conf.BASE_LAYERS as { [name: string]: L.TileLayer })[
          MAP_CONFIG["DEFAULT_PROVIDER"]
        ]
      : (conf.BASE_LAYERS as { [name: string]: L.TileLayer })[
          Object.keys(conf.BASE_LAYERS)[
            (Math.random() * MAP_CONFIG["BASEMAPS"].length) >> 0
          ]
        ];
  },
  ZOOM_CONTROL_POSITION: "topright",
  BASE_LAYER_CONTROL_POSITION: "topright",
  BASE_LAYER_CONTROL_INIT_COLLAPSED: true,
  FULLSCREEN_CONTROL_POSITION: "topright",
  GEOLOCATION_CONTROL_POSITION: "topright",
  SCALE_CONTROL_POSITION: "bottomleft",
  ZOOMVIEW_CONTROL_POSITION: "bottomleft",
  NEW_OBS_MARKER_ICON: () =>
    L.icon({
      iconUrl: "assets/pointer-blue2.png",
      iconSize: [33, 42],
      iconAnchor: [16, 42]
    }),
  OBS_MARKER_ICON: () =>
    L.icon({
      iconUrl: "assets/pointer-green.png",
      iconSize: [33, 42],
      iconAnchor: [16, 42]
    }),
  OBSERVATION_LAYER: () =>
    L.markerClusterGroup({
      iconCreateFunction: clusters => {
        const childCount = clusters.getChildCount();
        return conf.CLUSTER_MARKER_ICON(childCount);
      }
    }),
  CLUSTER_MARKER_ICON: (childCount: number) => {
    const quantifiedCssClass = (childCount: number) => {
      let c = " marker-cluster-";
      if (childCount < 10) {
        c += "small";
      } else if (childCount < 10) {
        c += "medium";
      } else {
        c += "large";
      }
      return c;
    };
    return new L.DivIcon({
      html: `<div><span>${childCount}</span></div>`,
      className: "marker-cluster" + quantifiedCssClass(childCount),
      iconSize: new L.Point(40, 40)
    });
  },
  PROGRAM_AREA_STYLE: (_feature: Feature) => {
    return {
      fillColor: "transparent",
      weight: 2,
      opacity: 0.8,
      color: "red",
      dashArray: "4"
    };
  }
};

@Component({
  selector: "app-obs-map",
  template: `
    <div
      [id]="options.MAP_ID"
      #map
      i18n-data-observation-zoom-statement-warning
      data-observation-zoom-statement-warning="Veuillez zoomer pour localiser votre observation."
    ></div>
  `,
  styleUrls: ["./map.component.css"],
  encapsulation: ViewEncapsulation.None
})
export class ObsMapComponent implements OnInit, OnChanges {
  @ViewChild("map") map!: ElementRef;
  @Input("observations") observations!: FeatureCollection;
  @Input("program") program!: FeatureCollection;
  @Output() onClick: EventEmitter<L.Point> = new EventEmitter();
  options: any;
  observationMap!: L.Map;
  programArea: L.GeoJSON | null = null;
  programMaxBounds!: L.LatLngBounds;
  observationLayer: L.MarkerClusterGroup | null = null;
  heatLayer: L.HeatLayer | null = null;
  newObsMarker: L.Marker | null = null;
  markers: {
    feature: Feature;
    marker: L.Marker<any>;
  }[] = [];
  obsOnFocus: Feature | null = null;
  shouldOpenAnotherPopup: boolean = false;
  zoomAlertTimeout: any;
  layerControl!: L.Control.Layers;

  constructor(
    private resolver: ComponentFactoryResolver,
    private injector: Injector
  ) {}

  ngOnInit() {
    this.initMap(conf);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (
      this.observationMap &&
      changes.program &&
      changes.program.currentValue
    ) {
      this.loadProgramArea();
    }

    if (
      this.observationMap &&
      changes.observations &&
      changes.observations.currentValue
    ) {
      this.loadObservations();
    }
  }

  async initMap(options: any, leafletOptions?: L.MapOptions): Promise<void> {
    this.options = options;
    this.observationMap = L.map(this.map.nativeElement, {
      ...leafletOptions,
      layers: [this.options.DEFAULT_BASE_MAP()], // TODO: add program overlay
      gestureHandling: true
    });

    // TODO: inject controls with options
    this.observationMap.zoomControl.setPosition(
      this.options.ZOOM_CONTROL_POSITION
    );

    this.layerControl = L.control
      .layers(this.options.BASE_LAYERS, undefined, {
        collapsed: this.options.BASE_LAYER_CONTROL_INIT_COLLAPSED,
        position: this.options.BASE_LAYER_CONTROL_POSITION
      })
      .addTo(this.observationMap);

    // const _fs = "Control.FullScreen";
    // const fs = await import(
    //   /* webpackInclude: /(Control\.FullScreen)\.js$/ */
    //   `node_modules/leaflet.fullscreen/${_fs}`
    // );
    // console.debug(fs.default);

    L.control
      .fullscreen<L.Control.Fullscreen>({
        // content: `bla`,
        position: this.options.FULLSCREEN_CONTROL_POSITION,
        title: "View Fullscreen",
        titleCancel: "Exit Fullscreen"
      } as L.Control.FullscreenOptions)
      .addTo(this.observationMap);

    L.control
      .locate({
        position: this.options.GEOLOCATION_CONTROL_POSITION,
        getLocationBounds: (locationEvent: L.LocationEvent) =>
          locationEvent.bounds.extend(this.programMaxBounds),
        locateOptions: {
          enableHighAccuracy: this.options.GEOLOCATION_HIGH_ACCURACY
        }
      })
      .addTo(this.observationMap);

    L.control
      .scale({ position: this.options.SCALE_CONTROL_POSITION })
      .addTo(this.observationMap);

    const ZoomViewer = L.Control.extend({
      onAdd: () => {
        const container = L.DomUtil.create("div");
        const gauge = L.DomUtil.create("div");
        container.style.padding = "0 .4em";
        container.style.background = "rgba(255,255,255,0.5)";
        container.style.textAlign = "center";
        container.className = "leaflet-control-zoomviewer";
        this.observationMap.on(
          "zoomstart zoom zoomend",
          _e => (gauge.innerHTML = "Zoom: " + this.observationMap.getZoom())
        );
        container.appendChild(gauge);

        return container;
      }
    });
    const zv = new ZoomViewer();
    zv.addTo(this.observationMap);
    zv.setPosition(this.options.ZOOMVIEW_CONTROL_POSITION);

    this.observationMap.on("popupclose", event => this.onPopupClose(event));
  }

  onPopupClose(event: L.LeafletEvent) {
    if (this.shouldOpenAnotherPopup && this.obsOnFocus) {
      this.showPopup(this.obsOnFocus, event);
    } else {
      this.obsOnFocus = null;
    }
    this.shouldOpenAnotherPopup = false;
  }

  getPopupContent(feature: Feature): any {
    const factory = this.resolver.resolveComponentFactory(MarkerPopupComponent);
    const component = factory.create(this.injector);
    component.instance.data = { ...feature.properties };
    component.changeDetectorRef.detectChanges();
    const popupContent = component.location.nativeElement;
    return popupContent;
  }

  loadObservations(): void {
    if (this.observations) {
      if (this.observationLayer) {
        this.layerControl.removeLayer(this.observationLayer);
        this.observationMap.removeLayer(this.observationLayer);
      }
      this.observationLayer = this.options.OBSERVATION_LAYER() as L.MarkerClusterGroup;

      this.observationLayer.addLayer(
        L.geoJSON(this.observations, this.mkObservationLayerOptions())
      );
      this.observationMap.addLayer(this.observationLayer);
      this.layerControl.addOverlay(this.observationLayer, "points");

      if (this.heatLayer) {
        this.layerControl.removeLayer(this.heatLayer);
        this.observationMap.removeLayer(this.heatLayer);
      }
      this.heatLayer = L.heatLayer(
        this.markers.map(item => item.marker.getLatLng()),
        { minOpacity: 0.5 }
      );
      this.layerControl.addOverlay(this.heatLayer, "heatmap");
    }
  }

  mkObservationLayerOptions() {
    this.markers = [];
    const observationLayerOptions: L.GeoJSONOptions = {
      onEachFeature: (feature, layer) => {
        let popupContent = this.getPopupContent(feature);
        layer.bindPopup(popupContent);
      },
      pointToLayer: (_feature, latlng): L.Marker => {
        let marker: L.Marker<any> = L.marker(latlng, {
          icon: conf.OBS_MARKER_ICON()
        });
        this.markers.push({
          feature: _feature,
          marker: marker
        });
        return marker;
      }
    };

    this.observationLayer!.on("animationend", _e => {
      if (this.obsOnFocus) {
        this.shouldOpenAnotherPopup = true;
        this.observationMap.closePopup();
      }
    });

    return observationLayerOptions;
  }

  showPopup(obs: Feature, event: L.LeafletEvent): void {
    this.obsOnFocus = obs;
    let marker = this.markers.find(
      marker =>
        marker.feature.properties!.id_observation ==
        obs.properties!.id_observation
    );
    let visibleParent: L.Marker = this.observationLayer!.getVisibleParent(
      marker!.marker
    );
    if (!visibleParent) {
      console.debug(event);
      this.observationMap.flyTo(marker!.marker.getLatLng(), 16);
      // this.observationMap.panTo(marker.marker.getLatLng());
      visibleParent = marker!.marker;
    }
    L.popup()
      .setLatLng(visibleParent.getLatLng())
      .setContent(this.getPopupContent(obs))
      .openOn(this.observationMap);
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
        this.programArea.on("click", this.onMarkerDrop, this);
      }
      this.programMaxBounds = programBounds;
    }
  }

  onMarkerDrop(event: L.LeafletMouseEvent) {
    let coords = L.point(event.latlng.lng, event.latlng.lat);

    if (this.newObsMarker !== null) {
      this.observationMap.removeLayer(this.newObsMarker);
    }

    if (!this.checkMinZoomLevel()) {
      return;
    }

    this.newObsMarker = L.marker(event.latlng, {
      icon: this.options.NEW_OBS_MARKER_ICON(),
      draggable: true
    }).addTo(this.observationMap);

    this.onClick.emit(coords);
  }

  checkMinZoomLevel(): boolean {
    let z = this.observationMap.getZoom();

    if (z < MAP_CONFIG.ZOOM_LEVEL_RELEVE) {
      L.DomUtil.addClass(
        this.observationMap.getContainer(),
        "observation-zoom-statement-warning"
      );
      if (this.zoomAlertTimeout) {
        clearTimeout(this.zoomAlertTimeout);
      }
      this.zoomAlertTimeout = setTimeout(() => {
        L.DomUtil.removeClass(
          this.observationMap.getContainer(),
          "observation-zoom-statement-warning"
        );
      }, 2000);
      return false;
    }
    return true;
  }

  @HostListener("document:NewObservationEvent", ["$event"])
  newObservationEventHandler(e: CustomEvent) {
    e.stopPropagation();
  }
}

@Component({
  selector: "popup",
  template: `
    <ng-container>
      <img
        [src]="
          data.image
            ? data.image
            : data.medias && !!data.medias.length
            ? data.medias[0].url
            : 'assets/Azure-Commun-019.JPG'
        "
      />
      <p>
        <b i18n>{{ data.taxref?.nom_vern }}</b> <br />
        <span i18n>
          Observé par
          {{
            data.observer && data.observer.username
              ? data.observer.username
              : "Anonyme"
          }}
          <br />
          le {{ data.date }}
        </span>
      </p>
      <div><img class="icon" src="assets/binoculars.png" /></div>
    </ng-container>
  `
})
export class MarkerPopupComponent {
  @Input() data!: {};
}
