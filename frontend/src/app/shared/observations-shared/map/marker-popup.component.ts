import {
  Component,
  Input,
  ViewEncapsulation,
  ChangeDetectionStrategy,
  OnInit,
  Inject,
  LOCALE_ID
} from '@angular/core';
import { AppConfig } from '../../../../conf/app.config';
import { Taxon } from '../../../core/models';
import { TaxonomyService } from '../../../services/taxonomy.service';
import { of } from 'rxjs';
// import { filter } from 'rxjs/operators';

interface TaxonData {
  cd_nom: number;
  images?: string;
  image?: string;
  media?: any;
  observer?: {
    username: string;
  };
  municipality?: {
    name?: string;
    code?: string;
  };
  date: Date;
}

@Component({
  selector: 'app-marker-popup',
  templateUrl: 'popup.template.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MarkerPopupComponent implements OnInit {
  AppConfig = AppConfig;
  @Input() data!: TaxonData;
  taxon = {} as TaxonData & Taxon;

  constructor(@Inject(LOCALE_ID) public localeId: string, public taxonService: TaxonomyService) {}

  ngOnInit() {
    console.debug(`init ${this.localeId}`);
    of(this.data)
      // .pipe(filter(data => !!data))
      .subscribe(data => {
        // console.debug(data);
        if (!!data && data.cd_nom) {
          this.taxonService.getTaxon(data.cd_nom).subscribe(t => {
            // console.debug({ ...t, ...data });
            this.taxon = { ...t, ...data };
          });
        }
      });
  }
}
