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
} from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormControl, FormGroup, Validators, AbstractControl, ValidatorFn } from '@angular/forms';
import { Observable } from 'rxjs';
import { debounceTime, map, distinctUntilChanged } from 'rxjs/operators';

import { NgbDate } from '@ng-bootstrap/ng-bootstrap';
import { FeatureCollection } from 'geojson';
import L from 'leaflet';

import { MAP_CONFIG } from '../../../../conf/map.config';
import { AppConfig } from '../../../../conf/app.config';
import { IAppConfig } from '../../../core/models';
import {
  PostObservationResponse,
  PostObservationResponsePayload,
  TaxonomyList,
  TaxonomyListItem
} from '../observation.model';
import { geometryValidator, ObsFormMapComponent } from './obs-form-map-component';

export function ngbDateMaxIsToday(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const today = new Date();
    const selected = NgbDate.from(control.value);
    if (!selected) {
      return { 'Null date': true };
    }
    const date_impl = new Date(selected.year, selected.month - 1, selected.day);
    return date_impl > today ? { 'Parsed a date in the future': true } : null;
  };
}

export const normalizeNgbDateControlValue = (date: NgbDate): string => {
  // months are 1 indexed
  const d = new Date(date.year, date.month - 1, date.day);
  // localized datetime to utc
  const r = new Date(d.getTime() - d.getTimezoneOffset() * 60 * 1000)
    .toISOString()
    .match(/\d{4}-\d{2}-\d{2}/);
  if (r && r.length) {
    return r[0];
  } else {
    throw new Error('invalid date value');
  }
};

type AppConfigObsForm = Pick<IAppConfig, 'API_ENDPOINT'>;

@Component({
  selector: 'app-obs-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class ObsFormComponent implements OnChanges {
  MAP_CONFIG = MAP_CONFIG;
  readonly AppConfig: AppConfigObsForm = AppConfig;
  private readonly URL = this.AppConfig.API_ENDPOINT;
  @Input()
  data!: {
    // [name: string]: any;
    coords?: L.Point;
    program?: FeatureCollection;
    taxa?: TaxonomyList;
  };
  @Output('newObservation') newObservation: EventEmitter<
    PostObservationResponsePayload
  > = new EventEmitter();
  @ViewChild('formMap') formMap: ObsFormMapComponent | undefined;
  @ViewChild('photo') photo: ElementRef | undefined;
  program_id = 0;
  taxa: TaxonomyListItem[] = [];
  species: { [name: string]: string }[] = [];
  taxaCount = 0;
  selectedTaxon: any;
  today = new Date();
  obsForm = new FormGroup({
    cd_nom: new FormControl('', Validators.required),
    count: new FormControl('1', Validators.required),
    comment: new FormControl(''),
    date: new FormControl(
      {
        year: this.today.getFullYear(),
        month: this.today.getMonth() + 1,
        day: this.today.getDate()
      },
      [Validators.required, ngbDateMaxIsToday()]
    ),
    photo: new FormControl(''),
    geometry: new FormControl(this.data && this.data.coords ? this.data.coords : '', [
      Validators.required,
      geometryValidator()
    ]),
    id_program: new FormControl(this.program_id)
  });
  taxonAutocompleteFields = AppConfig.taxonAutocompleteFields;
  taxonSelectInputThreshold = AppConfig.taxonSelectInputThreshold;
  taxonAutocompleteInputThreshold = AppConfig.taxonAutocompleteInputThreshold;
  taxonAutocompleteMaxResults = 10;
  autocomplete = 'isOff';
  hasZoomAlert: boolean | undefined;
  zoomAlertTimeout: any;

  disabledDates() {
    return (date: NgbDate, _current: { month: number }) => {
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
        term === '' // term.length < n
          ? []
          : this.species
              .filter(
                value => new RegExp(term, 'gi').test(value['name'])
                // v => v["name"].toLowerCase().indexOf(term.toLowerCase()) > -1
              )
              .slice(0, this.taxonAutocompleteMaxResults)
      )
      // tslint:disable-next-line: semicolon
    );

  inputAutoCompleteFormatter = (x: { name: string }) => x.name;

  inputAutoCompleteSetup() {
    for (const taxon of Object.keys(this.taxa)) {
      if (!!!taxon) {
        console.debug('no taxon for inputAutoCompleteSetup().');
        return;
      }
      let str = '';
      const fields: { [name: string]: string } = {};
      const t = this.taxa[taxon as any];
      for (const field of this.taxonAutocompleteFields) {
        if (t.taxref[field]) {
          fields[field] = t.taxref[field];
          str += ` \n${t.taxref[field]}`;
        }
      }
      this.species.push({
        ...fields,
        name: str,
        cd_nom: t.taxref.cd_nom,
        icon: t.medias.length ? t.medias.url : 'assets/default_taxon.jpg'
      });
    }
    this.autocomplete = 'isOn';
  }

  constructor(@Inject(LOCALE_ID) readonly localeId: string, private client: HttpClient) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes.data && changes.data.currentValue && this.data) {
      console.debug('form onChanges:', this.data);

      if (
        // FIXME: aot compilation complains
        this.data.program &&
        this.data.program.features &&
        !!this.data.program.features.length &&
        this.data.program.features[0] &&
        this.data.program.features[0].properties &&
        // ERROR in src/app/programs/observations/form/form.component.ts(182,9):
        // error TS2531: Object is possibly 'null'.
        // tslint:disable-next-line: no-non-null-assertion
        !!this.data.program.features[0].properties!.id_program
      ) {
        // src/app/programs/observations/form/form.component.ts(186,27):
        // error TS2531: Object is possibly 'null'.
        // tslint:disable-next-line: no-non-null-assertion
        this.program_id = this.data.program.features[0].properties!.id_program;
        console.debug('program_id:', this.program_id);
      }

      if (this.data.taxa) {
        this.taxa = Object.values(this.data.taxa);
        console.debug('taxa:', Object.values(this.data.taxa));
        this.taxaCount = this.taxa.length;
        console.debug('taxaCount:', this.taxaCount);
      }

      if (this.taxaCount >= this.taxonAutocompleteInputThreshold) {
        this.inputAutoCompleteSetup();
      }
    }
  }

  onTaxonSelected(taxon: TaxonomyListItem | any): void {
    console.debug(taxon);
    this.selectedTaxon = taxon;
    let patch = 0;
    if (Object.keys(taxon).indexOf('taxref') >= 0) {
      patch = taxon.taxref.cd_nom;
    } else if (Object.keys(taxon).indexOf('cd_nom') >= 0) {
      // still need this?!
      patch = taxon.cd_nom;
    }
    if (!!patch) {
      this.obsForm.controls['cd_nom'].patchValue(taxon.taxref['cd_nom']);
    }
  }

  isSelectedTaxon(taxon: TaxonomyListItem): boolean {
    return this.selectedTaxon === taxon;
  }

  onFormSubmit(): void {
    let obs: PostObservationResponsePayload;
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
        Accept: 'application/json'
      })
    };

    this.obsForm.controls['id_program'].patchValue(this.program_id);

    const formData: FormData = new FormData();

    if (this.photo) {
      const files: FileList = this.photo.nativeElement.files;
      if (files.length) {
        formData.append('file', files[0], files[0].name);
      }
    }

    const geometry = this.obsForm.get('geometry');
    if (!geometry) {
      throw new Error('form is missing required field geometry');
    }
    formData.append('geometry', JSON.stringify(geometry.value));

    const taxon = this.obsForm.get('cd_nom');
    if (!taxon) {
      throw new Error('form is missing required field taxon');
    }
    let cd_nom = Number.parseInt(taxon.value, 10);
    if (isNaN(cd_nom)) {
      cd_nom = Number.parseInt(taxon.value.cd_nom, 10);
      if (!cd_nom) {
        throw new Error('taxon value corrupted');
      }
    }
    formData.append('cd_nom', cd_nom.toString());

    const obsDateControlValue = NgbDate.from(this.obsForm.controls.date.value);
    if (!obsDateControlValue) {
      throw new Error('form is missing required field date');
    }
    const obsDate = normalizeNgbDateControlValue(obsDateControlValue);
    if (!obsDate) {
      throw new Error('date field value corrupted');
    }
    formData.append('date', obsDate);

    for (const item of ['count', 'comment', 'id_program']) {
      const c = this.obsForm.get(item);
      if (!c) {
        throw new Error(`form is missing field ${c}`);
      }
      if (item !== 'comment' && !!!c.value) {
        throw new Error(`form is missing required field ${c}`);
      }
      formData.append(item, c.value);
    }

    return this.client.post<PostObservationResponse>(
      `${this.URL}/observations`,
      formData,
      httpOptions
    );
  }
}
