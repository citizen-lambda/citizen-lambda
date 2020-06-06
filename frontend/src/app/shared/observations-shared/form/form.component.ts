import {
  Component,
  ViewEncapsulation,
  Input,
  Output,
  EventEmitter,
  Inject,
  LOCALE_ID,
  SimpleChanges,
  OnChanges,
  ChangeDetectionStrategy
} from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Validators, FormBuilder, ValidatorFn, AbstractControl } from '@angular/forms';
import { Observable } from 'rxjs';

import { NgbDate } from '@ng-bootstrap/ng-bootstrap';
import { FeatureCollection } from 'geojson';
import * as L from 'leaflet';

import { MAP_CONFIG } from '@conf/map.config';
import { AppConfig } from '@conf/app.config';
import { AppConfigInterface } from '@models/app-config.model';
import { Taxonomy, Taxon } from '@models/taxonomy.model';
import { ObsPostResponse, ObsPostResponsePayload } from '@models/observation.model';

type AppConfigObsForm = Pick<AppConfigInterface, 'API_ENDPOINT'>;

export function ngbDateMaxIsToday(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: boolean } | null => {
    const today = new Date();
    const selected = control.value;
    if (!selected) {
      return { 'Null date': true };
    }
    const dateImplementation = new Date(selected);
    return dateImplementation > today ? { 'Parsed a date in the future': true } : null;
  };
}

@Component({
  selector: 'app-obs-form',
  templateUrl: './form.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ObsFormComponent implements OnChanges {
  MAP_CONFIG = MAP_CONFIG;
  readonly AppConfig: AppConfigObsForm = AppConfig;

  @Input()
  data?: {
    // [name: string]: any;
    coords?: L.LatLng;
    program?: FeatureCollection;
    taxa?: Taxonomy;
  };
  @Output() newObservation: EventEmitter<ObsPostResponsePayload> = new EventEmitter();
  programId = 0;
  today = new Date();
  todayNgbDate = new NgbDate(
    this.today.getFullYear(),
    this.today.getMonth() + 1,
    this.today.getDate()
  );

  obsForm = this.fb.group({
    taxon_id: ['', Validators.compose([Validators.required])],
    count: ['1', Validators.compose([Validators.required, Validators.pattern('[^0][0-9]*')])],
    comment: [{ value: '', disabled: false }],
    date: [{ value: this.today, disabled: false }, [Validators.required, ngbDateMaxIsToday()]],
    photo: [{ value: '' /* null */, disabled: false }],
    geometry: [this.data?.coords ? this.data.coords : '', [Validators.required]],
    id_program: [this.programId]
  });

  /* map */
  hasZoomAlert: boolean | undefined;

  /* date */
  disabledNgbDates = (date: NgbDate): boolean => date.after(this.todayNgbDate);

  // TODO: update sharedState and rm/add marker to map
  onLatLon = (latitude: number, longitude: number): void =>
    console.log('form gps:', latitude, longitude);

  constructor(
    @Inject(LOCALE_ID) readonly localeId: string,
    private client: HttpClient,
    private fb: FormBuilder
  ) {}

  get taxa(): Taxon[] {
    return this.data?.taxa ? Object.values(this.data?.taxa) : [];
  }

  obsFormDebug = (): object => {
    return {
      ...this.obsForm.value,
      ...{
        photo: this.obsForm.get('photo')?.value
          ? Array.isArray(this.obsForm.get('photo')?.value)
            ? this.obsForm
                .get('photo')
                ?.value.reduce((acc: string[], item: { name: string }) => acc.concat(item.name), [])
            : this.obsForm.get('photo')?.value.name
          : this.obsForm.get('photo')?.value
      }
    };
  };
  ngOnChanges(changes: SimpleChanges): void {
    if (changes.data && changes.data.currentValue && this.data) {
      if (this.data.program?.features[0].properties?.id_program) {
        this.programId = this.data.program.features[0].properties.id_program;
        this.obsForm.controls.id_program.patchValue(this.programId);
      }

      if (this.data.coords) {
        this.obsForm.patchValue({ geometry: this.data.coords });
      }
    }
  }

  /*
  onTaxonSelected(selected: number | string): void {
    console.debug('form.onTaxonSelected', selected);
    this.obsForm.controls['cd_nom'].patchValue(selected);
  }
  */

  onFormSubmit(): void {
    // could it be that we need a changeDetection run?
    let obs: ObsPostResponsePayload;
    this.postObservation().subscribe(
      (data: ObsPostResponse) => {
        obs = data.features;
      },
      err => alert(err),
      () => {
        this.newObservation.emit(obs);
      }
    );
  }

  onMapClick(event: { coords?: L.LatLng }): void {
    if (event.coords) {
      this.obsForm.patchValue({ geometry: L.latLng(event.coords) });
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

    const formData: FormData = new FormData();

    formData.set('id_program', this.programId.toString());

    const taxon = this.obsForm.get('taxon_id')?.value;
    if (!taxon) {
      throw new Error('The required field "taxon" is missing.');
    } else {
      formData.set('cd_nom', taxon.toString());
    }

    const date = new Date(this.obsForm?.get('date')?.value).toISOString();
    if (!date) {
      throw new Error(`The field "date" is missing from the form.`);
    } else {
      formData.set('date', date);
    }

    const count = this.obsForm.get('count')?.value;
    if (!count) {
      throw new Error(`The field "count" is missing from the form.`);
    } else {
      formData.set('count', count);
    }

    formData.set('comment', this.obsForm?.get('comment')?.value);

    if (this.obsForm.get('photo')) {
      const files: File[] | File = this.obsForm.get('photo')?.value;
      if (Array.isArray(files) && files.length > 0) {
        // tslint:disable-next-line: prefer-for-of
        for (let i = 0; i < files.length; i++) {
          formData.append('files', files[i], files[i].name);
        }
      }
      // Is a minimum file size of 8kb a sensible value?
      if (files instanceof File && files.size > 8000) {
        formData.set('files', files, files.name);
      }
    }

    const geometry = this.obsForm.get('geometry');
    if (!geometry) {
      throw new Error('The required field "geometry" is missing.');
    } else {
      formData.set('geometry', JSON.stringify(geometry.value));
    }

    return this.client.post<ObsPostResponse>(
      `${this.AppConfig.API_ENDPOINT}/observations`,
      formData,
      httpOptions
    );
  }
}
