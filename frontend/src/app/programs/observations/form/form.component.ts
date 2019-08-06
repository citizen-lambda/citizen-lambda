import {
  Component,
  ViewEncapsulation,
  ViewChild,
  ElementRef,
  Input,
  Output,
  EventEmitter,
  Inject,
  LOCALE_ID,
  SimpleChanges,
  OnChanges
} from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import {
  FormControl,
  FormGroup,
  Validators,
  AbstractControl,
  ValidatorFn
} from "@angular/forms";
import { Observable } from "rxjs";
import { debounceTime, map, distinctUntilChanged } from "rxjs/operators";

import { NgbDate } from "@ng-bootstrap/ng-bootstrap";
import { FeatureCollection } from "geojson";
import L from "leaflet";
import "leaflet.fullscreen";
import "leaflet-gesture-handling";

import { AppConfig } from "../../../../conf/app.config";
import { IAppConfig } from "../../../core/models";
import {
  PostObservationResponse,
  ObservationFeature,
  TaxonomyList,
  TaxonomyListItem
} from "../observation.model";
import {
  geometryValidator,
  ObsFormMapComponent
} from "./obs-form-map-component";

export function ngbDateMaxIsToday(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const today = new Date();
    const selected = NgbDate.from(control.value);
    if (!selected) return { "Null date": true };
    const date_impl = new Date(selected.year, selected.month - 1, selected.day);
    return date_impl > today ? { "Parsed a date in the future": true } : null;
  };
}

type AppConfigObsForm = Pick<IAppConfig, "API_ENDPOINT">;

@Component({
  selector: "app-obs-form",
  templateUrl: "./form.component.html",
  styleUrls: ["./form.component.css"],
  encapsulation: ViewEncapsulation.None
})
export class ObsFormComponent implements OnChanges {
  readonly AppConfig: AppConfigObsForm = AppConfig;
  private readonly URL = this.AppConfig.API_ENDPOINT;
  @Input("data")
  data:
    | {
        // [name: string]: any;
        coords?: L.Point;
        program?: FeatureCollection;
        taxa?: TaxonomyList;
      }
    | undefined;
  @Output("newObservation") newObservation: EventEmitter<
    ObservationFeature
  > = new EventEmitter();
  @ViewChild("formMap") formMap: ObsFormMapComponent | undefined;
  @ViewChild("photo") photo: ElementRef | undefined;
  program_id: number | undefined;
  taxa: TaxonomyListItem[] = [];
  species: { [name: string]: string }[] = [];
  taxaCount: number | undefined;
  selectedTaxon: any;
  today = new Date();
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
    geometry: new FormControl(
      this.data && this.data.coords ? this.data.coords : "",
      [Validators.required, geometryValidator()]
    ),
    id_program: new FormControl(this.program_id)
  });
  taxonAutocompleteFields = AppConfig.taxonAutocompleteFields;
  taxonSelectInputThreshold = AppConfig.taxonSelectInputThreshold;
  taxonAutocompleteInputThreshold = AppConfig.taxonAutocompleteInputThreshold;
  taxonAutocompleteMaxResults = 10;
  autocomplete = "isOff";
  hasZoomAlert: boolean | undefined;
  zoomAlertTimeout: any;

  disabledDates() {
    return (date: NgbDate, current: { month: number }) => {
      const date_impl = new Date(date.year, date.month - 1, date.day);
      return date_impl > this.today;
    };
  }

  // this function has to stay anonymous.
  inputAutoCompleteSearch = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      map(term =>
        term === "" // term.length < n
          ? []
          : this.species
              .filter(
                value => new RegExp(term, "gi").test(value["name"])
                // v => v["name"].toLowerCase().indexOf(term.toLowerCase()) > -1
              )
              .slice(0, this.taxonAutocompleteMaxResults)
      )
    );

  inputAutoCompleteFormatter = (x: { name: string }) => x.name;

  inputAutoCompleteSetup() {
    for (let taxon in this.taxa) {
      if (!!!taxon) {
        console.debug("no taxon for inputAutoCompleteSetup().");
        return;
      }
      let str: string = "";
      let fields: { [name: string]: string } = {};
      for (let field of this.taxonAutocompleteFields) {
        if (this.taxa[taxon]["taxref"][field]) {
          fields[field] = this.taxa[taxon]["taxref"][field];
          str += ` \n${this.taxa[taxon]["taxref"][field]}`;
        }
      }
      this.species.push({
        ...fields,
        name: str,
        cd_nom: this.taxa[taxon]["taxref"]["cd_nom"],
        icon: !!this.taxa[taxon]["medias"]
          ? this.taxa[taxon]["medias"]["url"]
          : "assets/default_taxon"
      });
    }
    this.autocomplete = "isOn";
  }

  constructor(
    @Inject(LOCALE_ID) readonly localeId: string,
    private http: HttpClient
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes.data && changes.data.currentValue && this.data) {
      this.program_id = this.data.program!.features[0].properties![
        "id_program"
      ]!;
      this.taxa = Object.values(this.data.taxa!);
      this.taxaCount = this.taxa.length;

      console.debug("form onChanges:", this.data);
      console.debug("taxa:", Object.values(this.data.taxa!));
      console.debug("program_id:", this.program_id);
      console.debug("taxaCount:", this.taxaCount);

      if (this.taxaCount >= this.taxonAutocompleteInputThreshold) {
        this.inputAutoCompleteSetup();
      }
    }
  }

  onTaxonSelected(taxon: TaxonomyListItem | any): void {
    console.debug(taxon);
    this.selectedTaxon = taxon;
    let patch = 0;
    if (Object.keys(taxon).indexOf("taxref") >= 0) {
      patch = taxon.taxref.cd_nom;
    } else if (Object.keys(taxon).indexOf("cd_nom") >= 0) {
      // still need this?!
      patch = taxon.cd_nom;
    }
    if (!!patch) {
      this.obsForm.controls["cd_nom"].patchValue(taxon.taxref["cd_nom"]);
    }
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

  onMapClick(e: any) {
    if (e && e.coords) {
      this.obsForm.patchValue({ geometry: e.coords });
    }
  }

  postObservation(): Observable<PostObservationResponse> {
    const httpOptions = {
      headers: new HttpHeaders({
        Accept: "application/json"
      })
    };

    this.obsForm.controls["id_program"].patchValue(this.program_id);

    let formData: FormData = new FormData();

    const files: FileList = this.photo!.nativeElement.files;
    if (files.length > 0) {
      formData.append("file", files[0], files[0].name);
    }

    formData.append(
      "geometry",
      JSON.stringify(this.obsForm.get("geometry")!.value)
    );

    const taxon = this.obsForm.get("cd_nom")!.value;
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
      .match(/\d{4}-\d{2}-\d{2}/)![0];
    formData.append("date", normDate);

    for (let item of ["count", "comment", "id_program"]) {
      formData.append(item, this.obsForm.get(item)!.value);
    }

    return this.http.post<PostObservationResponse>(
      `${this.URL}/observations`,
      formData,
      httpOptions
    );
  }
}
