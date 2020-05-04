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
  OnChanges,
  AfterViewInit
} from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormControl, FormGroup, Validators, AbstractControl, ValidatorFn } from '@angular/forms';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Observable, BehaviorSubject } from 'rxjs';
import { debounceTime, map, distinctUntilChanged } from 'rxjs/operators';

import { NgbDate } from '@ng-bootstrap/ng-bootstrap';
import { FeatureCollection } from 'geojson';
import * as L from 'leaflet';
import EXIF from 'exif-js';

import { MAP_CONFIG } from '../../../../conf/map.config';
import { AppConfig } from '../../../../conf/app.config';
import { AppConfigInterface, Taxonomy, Taxon } from '../../../core/models';
import {
  ObsPostResponse,
  ObsPostResponsePayload
} from '../../../features/observations/observation.model';
import { geometryValidator, ObsFormMapComponent } from './obs-form-map-component';

type AppConfigObsForm = Pick<AppConfigInterface, 'API_ENDPOINT'>;
type CompletionResults = {
  [name: string]: string;
}[];

export function ngbDateMaxIsToday(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: boolean } | null => {
    const today = new Date();
    const selected = NgbDate.from(control.value);
    if (!selected) {
      return { 'Null date': true };
    }
    const dateImplementation = new Date(selected.year, selected.month - 1, selected.day);
    return dateImplementation > today ? { 'Parsed a date in the future': true } : null;
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

@Component({
  selector: 'app-obs-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class ObsFormComponent implements OnChanges, AfterViewInit {
  MAP_CONFIG = MAP_CONFIG;
  readonly AppConfig: AppConfigObsForm = AppConfig;
  private readonly URL = this.AppConfig.API_ENDPOINT;
  @Input()
  data!: {
    // [name: string]: any;
    coords?: L.Point;
    program?: FeatureCollection;
    taxa?: Taxonomy;
  };
  @Output() newObservation: EventEmitter<ObsPostResponsePayload> = new EventEmitter();
  @ViewChild('formMap', { static: false }) formMap: ObsFormMapComponent | undefined;
  @ViewChild('photo', { static: false }) photo: ElementRef | undefined;
  program_id = 0;
  taxa: Taxon[] = [];
  species: { [name: string]: string }[] = [];
  taxaCount = 0;
  selectedTaxon: { item: Partial<Taxon> & { icon: string } } | Partial<Taxon> | undefined;
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
  photoFilename$ = new BehaviorSubject<string>('');
  imageBlobURL: SafeUrl = '';
  taxonAutocompleteFields = AppConfig.taxonAutocompleteFields;
  taxonSelectInputThreshold = AppConfig.taxonSelectInputThreshold;
  taxonAutocompleteInputThreshold = AppConfig.taxonAutocompleteInputThreshold;
  taxonAutocompleteMaxResults = 10;
  autocomplete = 'isOff';
  hasZoomAlert: boolean | undefined;

  disabledDates = (date: NgbDate): boolean => {
    const dateImplementation = new Date(date.year, date.month - 1, date.day);
    return dateImplementation > this.today;
    // tslint:disable-next-line: semicolon
  };

  inputAutoCompleteSearch = (text$: Observable<string>): Observable<CompletionResults> =>
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

  inputAutoCompleteFormatter = (x: { name: string }): string => x.name;

  inputAutoCompleteSetup(): void {
    function prop<T, K extends keyof T>(obj: T, key: K): T[K] {
      return obj[key];
    }
    for (const taxon of this.taxa) {
      if (!taxon) {
        const msg = 'No taxon for inputAutoCompleteSetup().';
        console.error(msg);
        alert(msg);
        return;
      }
      let str = '';
      const fields: { [key: string]: Partial<Taxon[keyof Taxon]> } = {};
      for (const field of this.taxonAutocompleteFields as [keyof Taxon]) {
        if (field in taxon) {
          const val = prop(taxon, field);
          fields[field] = val;
          str += ` \n${val}`;
        }
      }
      this.species.push({
        ...fields,
        name: str,
        cd_nom: taxon.cd_nom.toString(),
        icon: taxon.media?.length > 0 ? taxon.media[0].thumb_url : 'assets/default_taxon.jpg'
      });
    }
    this.autocomplete = 'isOn';
  }

  constructor(
    @Inject(LOCALE_ID) readonly localeId: string,
    private sanitizer: DomSanitizer,
    private client: HttpClient
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.data && changes.data.currentValue && this.data) {
      console.debug('form onChanges:', this.data);

      if (this.data.program?.features[0].properties?.id_program) {
        this.program_id = this.data.program.features[0].properties.id_program;
      }

      if (this.data.taxa) {
        this.taxa = Object.values(this.data.taxa);
        // console.debug('taxa:', Object.values(this.data.taxa));
        this.taxaCount = this.taxa.length;
        // console.debug('taxaCount:', this.taxaCount);
      }

      if (this.taxaCount >= this.taxonAutocompleteInputThreshold) {
        this.inputAutoCompleteSetup();
      }
    }
  }

  ngAfterViewInit(): void {
    if (this.data && this.data.coords) {
      this.obsForm.patchValue({ geometry: this.data.coords });
    }
  }

  onTaxonSelected(selected: { item: Partial<Taxon> & { icon: string } } | Partial<Taxon>): void {
    console.debug('onTaxonSelected', typeof selected, selected);
    if ('item' in selected) {
      // Taxon autocompleted input
      this.selectedTaxon = selected.item;
      this.obsForm.controls['cd_nom'].patchValue(selected.item.cd_nom);
      // console.debug(selected.item.cd_nom);
    } else {
      // Taxon picker / image gallery
      this.selectedTaxon = selected;
      this.obsForm.controls['cd_nom'].patchValue(selected.cd_nom);
    }
  }

  async onPhotoUpdate(): Promise<void> {
    if (this.photo) {
      const files: FileList = this.photo.nativeElement.files;
      if (files.length > 0) {
        this.photoFilename$.next(files[0].name);
        this.imageBlobURL = this.sanitizer.bypassSecurityTrustResourceUrl(
          window.URL.createObjectURL(files[0])
        );

        const reader = new FileReader();
        reader.addEventListener('load', () => {
          try {
            const exifData = EXIF.readFromBinaryFile(reader.result);
            if (exifData.latitude && exifData.longitude) {
              console.debug('gps:', exifData.latitude, exifData.longitude);
              const p = L.point(exifData.longitude, exifData.latitude);
              this.obsForm.patchValue({ geometry: p });
              this.data.coords = p;
              // ask map to create a marker if it doesn't exit
            }
          } catch (error) {
            console.debug('No EXIF data', error);
          }
        });
      }
    }
  }

  isSelectedTaxon(taxon: Taxon): boolean {
    return this.selectedTaxon === taxon;
  }

  onFormSubmit(): void {
    let obs: ObsPostResponsePayload;
    this.postObservation().subscribe(
      (data: ObsPostResponse) => {
        obs = data.features[0];
      },
      err => alert(err),
      () => {
        this.newObservation.emit(obs);
      }
    );
  }

  onMapClick(event: { coords?: L.Point }): void {
    if (event.coords) {
      this.obsForm.patchValue({ geometry: event.coords });
    } else {
      this.obsForm.patchValue({ geometry: undefined });
    }
  }

  postObservation(): Observable<ObsPostResponse> {
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
      throw new Error('The required field "geometry" is missing.');
    }
    formData.append('geometry', JSON.stringify(geometry.value));

    const taxon = this.obsForm.get('cd_nom');
    if (!taxon) {
      throw new Error('The required field "taxon" is missing.');
    }
    let taxonID = Number.parseInt(taxon.value, 10);
    if (isNaN(taxonID)) {
      taxonID = Number.parseInt(taxon.value.cd_nom, 10);
      if (!taxonID) {
        throw new Error('The taxon identifier is corrupt.');
      }
    }
    formData.append('cd_nom', taxonID.toString());

    const obsDateControlValue = NgbDate.from(this.obsForm.controls.date.value);
    if (!obsDateControlValue) {
      throw new Error('The required field "date" is missing.');
    }
    const obsDate = normalizeNgbDateControlValue(obsDateControlValue);
    if (!obsDate) {
      throw new Error('date field value corrupted');
    }
    formData.append('date', obsDate);

    for (const item of ['count', 'comment', 'id_program']) {
      const c = this.obsForm.get(item);
      if (!c) {
        throw new Error(`The required field "${c}" is missing.`);
      }
      if (item !== 'comment' && !c.value) {
        throw new Error(`The required field "${c}" is missing.`);
      }
      formData.append(item, c.value);
    }

    return this.client.post<ObsPostResponse>(`${this.URL}/observations`, formData, httpOptions);
  }
}
