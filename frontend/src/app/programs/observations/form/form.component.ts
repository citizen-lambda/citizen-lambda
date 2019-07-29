import {
  Component,
  ViewEncapsulation,
  AfterViewInit,
  ViewChild,
  ElementRef,
  Input,
  Output,
  EventEmitter,
  Inject,
  LOCALE_ID
} from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { ActivatedRoute } from "@angular/router";
import {
  FormControl,
  FormGroup,
  Validators,
  AbstractControl,
  ValidatorFn
} from "@angular/forms";
import { Observable } from "rxjs";
import {
  share,
  debounceTime,
  map,
  distinctUntilChanged,
  tap
} from "rxjs/operators";

import { NgbDate } from "@ng-bootstrap/ng-bootstrap";
import { FeatureCollection } from "geojson";
import * as L from "leaflet";
import { LeafletMouseEvent } from "leaflet";
import "leaflet-fullscreen";
import "leaflet-gesture-handling";

import { AppConfig } from "../../../../conf/app.config";
import { MAP_CONFIG } from "../../../../conf/map.config";
import {
  PostObservationResponse,
  ObservationFeature,
  TaxonomyList,
  TaxonomyListItem
} from "../observation.model";
import { GncProgramsService } from "../../../api/gnc-programs.service";

declare let $: any;

const PROGRAM_AREA_STYLE = {
  fillColor: "transparent",
  weight: 2,
  opacity: 0.8,
  color: "red",
  dashArray: "4"
};
const taxonSelectInputThreshold = AppConfig.taxonSelectInputThreshold;
const taxonAutocompleteInputThreshold =
  AppConfig.taxonAutocompleteInputThreshold;
const taxonAutocompleteFields = AppConfig.taxonAutocompleteFields;
const taxonAutocompleteMaxResults = 10;

// TODO: migrate to conf
export const obsFormMarkerIcon = L.icon({
  iconUrl: "assets/pointer-blue2.png",
  iconSize: [33, 42],
  iconAnchor: [16, 42]
});

export function ngbDateMaxIsToday(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const today = new Date();
    const selected = NgbDate.from(control.value);
    if (!selected) return { "Null date": true };
    const date_impl = new Date(selected.year, selected.month - 1, selected.day);
    return date_impl > today ? { "Parsed a date in the future": true } : null;
  };
}

export function geometryValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const validGeometry = /Point\(\d{1,3}(|\.\d{1,7}),(|\s)\d{1,3}(|\.\d{1,7})\)$/.test(
      control.value
    );
    return validGeometry ? null : { geometry: { value: control.value } };
  };
}

@Component({
  selector: "app-obs-form",
  templateUrl: "./form.component.html",
  styleUrls: ["./form.component.css"],
  encapsulation: ViewEncapsulation.None
})
export class ObsFormComponent implements AfterViewInit {
  private readonly URL = AppConfig.API_ENDPOINT;
  @Input("coords") coords: L.Point;
  @Output("newObservation") newObservation: EventEmitter<
    ObservationFeature
  > = new EventEmitter();
  @ViewChild("photo") photo: ElementRef;
  today = new Date();
  program_id: any;
  obsForm = new FormGroup({
    cd_nom: new FormControl("", Validators.required),
    count: new FormControl("1", Validators.required),
    comment: new FormControl(""),
    date: new FormControl(
      {
        year: this.today.getFullYear(),
        month: this.today.getMonth() + 1,
        day: this.today.getDate()
      },
      [Validators.required, ngbDateMaxIsToday()]
    ),
    photo: new FormControl(""),
    geometry: new FormControl(this.coords ? this.coords : "", [
      Validators.required,
      geometryValidator()
    ]),
    id_program: new FormControl(this.program_id)
  });
  taxonSelectInputThreshold = taxonSelectInputThreshold;
  taxonAutocompleteInputThreshold = taxonAutocompleteInputThreshold;
  autocomplete = "isOff";
  MAP_CONFIG = MAP_CONFIG;
  formMap: L.Map;
  program: FeatureCollection;
  taxonomyListID: number;
  taxa: TaxonomyList;
  surveySpecies$: Observable<TaxonomyList>;
  species: Object[] = [];
  taxaCount: number;
  selectedTaxon: any;
  hasZoomAlert: boolean;
  zoomAlertTimeout: any;

  disabledDates = (date: NgbDate, current: { month: number }) => {
    const date_impl = new Date(date.year, date.month - 1, date.day);
    return date_impl > this.today;
  };

  inputAutoCompleteSearch = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      map(term =>
        term === "" // term.length < n
          ? []
          : this.species
              .filter(
                (v: { [name: string]: string }) =>
                  new RegExp(term, "gi").test(v["name"])
                // v => v["name"].toLowerCase().indexOf(term.toLowerCase()) > -1
              )
              .slice(0, taxonAutocompleteMaxResults)
      )
    );

  inputAutoCompleteFormatter = (x: { name: string }) => x.name;

  inputAutoCompleteSetup = () => {
    for (let taxon in this.taxa) {
      for (let field of taxonAutocompleteFields) {
        if (this.taxa[taxon]["taxref"][field]) {
          this.species.push({
            name:
              field === "cd_nom"
                ? `${this.taxa[taxon]["taxref"]["cd_nom"]} - ${this.taxa[taxon]["taxref"]["nom_complet"]}`
                : this.taxa[taxon]["taxref"][field],
            cd_nom: this.taxa[taxon]["taxref"]["cd_nom"],
            icon: !!this.taxa[taxon]["medias"]
              ? this.taxa[taxon]["medias"]["url"]
              : "assets/Azure-Commun-019.JPG"
          });
        }
      }
    }
    this.autocomplete = "isOn";
  };

  constructor(
    @Inject(LOCALE_ID) readonly localeId: string,
    private http: HttpClient,
    private programService: GncProgramsService,
    private route: ActivatedRoute
  ) {}

  ngAfterViewInit() {
    this.route.params.subscribe(params => (this.program_id = params["id"]));
    this.http
      .get(`${AppConfig.API_ENDPOINT}/programs/${this.program_id}`)
      .subscribe((result: FeatureCollection) => {
        this.program = result;
        this.taxonomyListID = this.program.features[0].properties.taxonomy_list;
        this.surveySpecies$ = this.programService
          .getProgramTaxonomyList(this.program_id)
          .pipe(
            tap(species => {
              this.taxa = species;
              this.taxaCount = Object.keys(this.taxa).length;
              if (this.taxaCount >= this.taxonAutocompleteInputThreshold) {
                this.inputAutoCompleteSetup();
              }
            }),
            share()
          );
        this.surveySpecies$.subscribe();

        // build map control
        const formMap = L.map("formMap", { gestureHandling: true });
        this.formMap = formMap;

        L.tileLayer("//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "OpenStreetMap"
        }).addTo(formMap);

        L.control
          .fullscreen({
            position: "topright",
            title: {
              false: "View Fullscreen",
              true: "Exit Fullscreen"
            }
          })
          .addTo(formMap);

        let ZoomViewer = L.Control.extend({
          onAdd: () => {
            let container = L.DomUtil.create("div");
            let gauge = L.DomUtil.create("div");
            container.style.width = "200px";
            container.style.background = "rgba(255,255,255,0.5)";
            container.style.textAlign = "left";
            container.className = "leaflet-control-zoomviewer mb-0";
            formMap.on("zoomstart zoom zoomend", function(_e) {
              gauge.innerHTML = "Zoom level: " + formMap.getZoom();
            });
            container.appendChild(gauge);

            return container;
          }
        });
        let zv = new ZoomViewer();
        zv.addTo(formMap);
        zv.setPosition("bottomleft");

        const programArea = L.geoJSON(this.program, {
          style: function(_feature) {
            return PROGRAM_AREA_STYLE;
          }
        }).addTo(formMap);

        const maxBounds: L.LatLngBounds = programArea.getBounds();
        formMap.fitBounds(maxBounds);
        formMap.setMaxBounds(maxBounds.pad(0.01));

        // Set initial observation marker from main map if already spotted
        let myMarker: L.Marker = null;
        if (this.coords) {
          this.obsForm.patchValue({ geometry: this.coords });

          myMarker = L.marker([this.coords.y, this.coords.x], {
            icon: obsFormMarkerIcon,
            draggable: true
          }).addTo(formMap);
        }

        // Update marker on click event
        formMap.on("click", (e: LeafletMouseEvent) => {
          let z = formMap.getZoom();

          if (z < MAP_CONFIG.ZOOM_LEVEL_RELEVE) {
            // this.hasZoomAlert = true;
            L.DomUtil.addClass(
              formMap.getContainer(),
              "observation-zoom-statement-warning"
            );
            if (this.zoomAlertTimeout) {
              clearTimeout(this.zoomAlertTimeout);
            }
            this.zoomAlertTimeout = setTimeout(() => {
              L.DomUtil.removeClass(
                formMap.getContainer(),
                "observation-zoom-statement-warning"
              );
            }, 2000);
            return;
          }
          // PROBLEM: if program area is a concave polygon: one can still put a marker in the cavities.
          // POSSIBLE SOLUTION: See ray casting algorithm for inspiration at https://stackoverflow.com/questions/31790344/determine-if-a-point-reside-inside-a-leaflet-polygon
          if (maxBounds.contains([e.latlng.lat, e.latlng.lng])) {
            if (!myMarker) {
              myMarker = L.marker(e.latlng, {
                icon: obsFormMarkerIcon,
                draggable: true
              }).addTo(formMap);
            }

            this.coords = L.point(e.latlng.lng, e.latlng.lat);
            this.obsForm.patchValue({ geometry: this.coords });
          }
        });
      });
  }

  onTaxonSelected(taxon: TaxonomyListItem): void {
    this.selectedTaxon = taxon;
    this.obsForm.controls["cd_nom"].patchValue(taxon.taxref["cd_nom"]);
  }

  isSelectedTaxon(taxon: TaxonomyListItem): boolean {
    return this.selectedTaxon === taxon;
  }

  onFormSubmit(): void {
    let obs: ObservationFeature;
    this.postObservation().subscribe(
      (data: PostObservationResponse) => {
        obs = data.features[0];
      },
      err => alert(err),
      () => {
        this.newObservation.emit(obs);
      }
    );
  }

  postObservation(): Observable<PostObservationResponse> {
    const httpOptions = {
      headers: new HttpHeaders({
        Accept: "application/json"
      })
    };

    this.obsForm.controls["id_program"].patchValue(this.program_id);

    let formData: FormData = new FormData();

    const files: FileList = this.photo.nativeElement.files;
    if (files.length > 0) {
      formData.append("file", files[0], files[0].name);
    }

    formData.append(
      "geometry",
      JSON.stringify(this.obsForm.get("geometry").value)
    );

    const taxon = this.obsForm.get("cd_nom").value;
    let cd_nom = Number.parseInt(taxon);
    if (isNaN(cd_nom)) {
      cd_nom = Number.parseInt(taxon.cd_nom);
    }
    formData.append("cd_nom", cd_nom.toString());

    const obsDateControlValue = NgbDate.from(this.obsForm.controls.date.value);
    const obsDate = new Date(
      obsDateControlValue.year,
      obsDateControlValue.month - 1,
      obsDateControlValue.day
    );
    const normDate = new Date(
      obsDate.getTime() - obsDate.getTimezoneOffset() * 60 * 1000
    )
      .toISOString()
      .match(/\d{4}-\d{2}-\d{2}/)[0];
    formData.append("date", normDate);

    for (let item of ["count", "comment", "id_program"]) {
      formData.append(item, this.obsForm.get(item).value);
    }

    return this.http.post<PostObservationResponse>(
      `${this.URL}/observations`,
      formData,
      httpOptions
    );
  }
}
