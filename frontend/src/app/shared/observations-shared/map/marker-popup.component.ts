import {
  Component,
  Input,
  ViewEncapsulation,
  ChangeDetectionStrategy,
  OnInit,
  Inject,
  LOCALE_ID,
  TemplateRef
} from '@angular/core';
import { AppConfig } from '../../../../conf/app.config';
import { Taxon } from '../../../core/models';
import { TaxonomyService } from '../../../services/taxonomy.service';
import { of, BehaviorSubject } from 'rxjs';

import {NgbModal, ModalDismissReasons} from '@ng-bootstrap/ng-bootstrap';

interface TaxonData {
  cd_nom: number;
  images?: string;
  image?: string;
  media?: any;
  comment?: string;
  observer?: {
    username: string;
  };
  municipality?: {
    name?: string;
    code?: string;
  };
  date: Date;
  count: Number;
}


// import { Pipe, PipeTransform } from '@angular/core';
// import { isObservable, of } from 'rxjs';
// import { map, startWith, catchError } from 'rxjs/operators';

// @Pipe({
//   name: 'withLoading',
// })
// export class WithLoadingPipe implements PipeTransform {
//   transform(val: any) {
//     return isObservable(val)
//       ? val.pipe(
//         map((value: any) => ({ loading: false, value })),
//         startWith({ loading: true }),
//         catchError(error => of({ loading: false, error }))
//       )
//       : val;
//   }
// }


@Component({
  selector: 'app-marker-popup',
  templateUrl: 'popup.template.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MarkerPopupComponent implements OnInit {
  AppConfig = AppConfig;
  @Input() data!: TaxonData;
  @Input() popupTemplate!: TemplateRef<HTMLElement>;
  taxon$ = new BehaviorSubject<TaxonData & Taxon | undefined>(undefined);
  closeResult = '';


  constructor(
    @Inject(LOCALE_ID) public localeId: string,
    public taxonService: TaxonomyService,
    private modalService: NgbModal
  ) {}

  ngOnInit() {
    of(this.data)
      .subscribe(data => {
        if (!!data && data.cd_nom) {
          this.taxonService.getTaxon(data.cd_nom).subscribe(t => {
            this.taxon$.next({ ...t, ...data });
          });
        }
      });
  }

  open(content: any) {
    this.modalService.open(content, {ariaLabelledBy: 'modal-obs-details'}).result.then((result) => {
      this.closeResult = `Closed with: ${result}`;
    }, (reason) => {
      this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
    });
  }

  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return  `with: ${reason}`;
    }
  }
}
