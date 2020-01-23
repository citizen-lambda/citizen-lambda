import { Component, OnInit, Inject, LOCALE_ID, Input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { of, BehaviorSubject } from 'rxjs';
import { map, take } from 'rxjs/operators';

import {
  NgbModal,
  ModalDismissReasons,
  NgbActiveModal,
  NgbModalRef
} from '@ng-bootstrap/ng-bootstrap';

import { AppConfig } from '../../../../conf/app.config';
import { ObservationData, Taxon } from '../../../core/models';
import { TaxonomyService } from '../../../services/taxonomy.service';
import { ObservationsFacade } from '../../../features/observations/obs.component';

@Component({
  selector: 'app-obs-details-modal-content',
  template: `
    <div class="modal-header">
      <h4 class="modal-title" id="modal-obs-details">Details {{ data?.id_observation }}</h4>
      <button type="button" class="close" aria-label="Close" (click)="modal.dismiss('Cross click')">
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
    <div class="modal-body obs-added" *ngIf="taxon$ | async as taxon">
      <div>
        <!-- FIXME: hardcoded backend media url -->
        <img
          [src]="
            !!data?.images && !!data?.images?.length
              ? AppConfig.API_ENDPOINT + '/media/' + (data?.images)[0]
              : data?.image
              ? data?.image
              : taxon?.media && !!taxon?.media.length
              ? (taxon?.media)[0].thumb_url
              : 'assets/default_taxon.jpg'
          "
          [alt]="
            !localeId.startsWith('fr') && !!taxon?.nom_vern_eng
              ? taxon?.nom_vern_eng
              : taxon?.nom_vern
              ? taxon?.nom_vern
              : taxon?.nom_valide
          "
        />
      </div>
      <p>
        {{
          !localeId.startsWith('fr') ?
          !!taxon?.nom_vern_eng ?
            [taxon?.nom_vern_eng, taxon?.nom_vern].join(', ')
            : taxon?.nom_vern
          : [taxon?.nom_vern, taxon?.nom_vern_eng].join(', ')
        }}
      </p>
      <p>{{ taxon?.nom_complet }}</p>
      <p i18n>Dénombrement: {{ data?.count }}</p>
      <p *ngIf="!!data?.comment">{{ data?.comment }}</p>
      <!-- <p i18n>Statut: {{ taxon?.id_statut }}</p> -->
      <br />
      <ul style="text-align: left;">
        <li>
          <span i18n>Phylum: {{ taxon?.phylum }}</span>
        </li>
        <li>
          <ul>
            <li>
              <span i18n>Classe: {{ taxon?.classe }}</span>
            </li>
            <li>
              <ul>
                <li>
                  <span i18n>Ordre: {{ taxon?.ordre }}</span>
                </li>
                <li>
                  <ul>
                    <li>
                      <span i18n>Famille: {{ taxon?.famille }}</span>
                    </li>
                  </ul>
                </li>
              </ul>
            </li>
          </ul>
        </li>
      </ul>
      <!-- <p i18n>cd_nom: {{ taxon?.cd_nom }}</p>
    <p i18n>cd_ref: {{ taxon?.cd_ref }}</p>
    <p i18n>cd_sup: {{ taxon?.cd_sup }}</p> -->
      <!-- <p>{{ taxon | json }}</p> -->
      <br />
      <p i18n>Découvrir sur INPN:</p>
      <ul>
        <li>
          <a
            rel="noopener"
            target="_blank"
            [href]="['https://inpn.mnhn.fr/espece/cd_nom', taxon?.cd_nom].join('/')"
            i18n
            >le taxon</a
          >
        </li>
        <li *ngIf="taxon?.cd_nom != taxon?.cd_ref">
          <a
            rel="noopener"
            target="_blank"
            [href]="['https://inpn.mnhn.fr/espece/cd_nom', taxon?.cd_ref].join('/')"
            i18n
            >le taxon de référence</a
          >
        </li>
        <!-- <li>
        <a
          rel="noopener" target="_blank"
          [href]="['https://inpn.mnhn.fr/espece/cd_nom', taxon?.cd_sup].join('/')"
          i18n
          >le taxon supérieur</a
        >
      </li> -->
      </ul>
    </div>
  `,
  providers: [ObservationsFacade]
})
export class ObsDetailsModalContentComponent implements OnInit {
  AppConfig = AppConfig;
  @Input() data!: Partial<ObservationData> | undefined;
  taxon$ = new BehaviorSubject<(Partial<ObservationData> & Taxon) | undefined>(undefined);

  constructor(
    @Inject(LOCALE_ID) public localeId: string,
    public modal: NgbActiveModal,
    public taxonService: TaxonomyService
  ) {}

  ngOnInit() {
    of(this.data).subscribe(data => {
      // console.debug(data);
      if (!!data && data.cd_nom) {
        this.taxonService.getTaxon(data.cd_nom).subscribe(t => {
          this.taxon$.next({ ...t, ...data });
        });
      }
    });
  }
}

@Component({
  template: '',
  styleUrls: []
})
export class ObservationSharedDetailsComponent implements OnInit {
  modalRef?: NgbModalRef;
  closeResult = '';
  data: Partial<ObservationData> = {};

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private modalService: NgbModal,
    public facade: ObservationsFacade
  ) {}

  ngOnInit(): void {
    this.route.paramMap.pipe(take(1)).subscribe(params => {
      const obsID = parseInt(params.get('obsid') || '1', 10);
      this.facade.features$
        .pipe(
          map(features =>
            // tslint:disable-next-line: no-non-null-assertion
            features.filter(feature => feature!.properties!.id_observation === obsID)
          ),
          take(1)
        )
        .subscribe(feature => {
          try {
            this.data = feature[0].properties as Partial<ObservationData>;
            this.facade.selected = feature[0];
            this.open();
          } catch (error) {
            this.onError(error);
          }
        });
    });
  }

  onError(error: any) {
    let msg = error.toString();
    if (error instanceof TypeError) {
      msg = 'Unknown observation';
      window.alert(msg);
    }
    console.error(error);
    this.close(msg);
    this.router.navigate(['../../'], { fragment: 'observations', relativeTo: this.route });
  }

  close(msg: string) {
    if (this.modalRef) {
      this.modalRef.close(msg);
    }
  }

  open() {
    this.modalRef = this.modalService.open(ObsDetailsModalContentComponent);
    this.modalRef.componentInstance.data = this.data;
    this.modalRef.result.then(
      result => {
        this.closeResult = `Closed with: ${result}`;
        this.router.navigate(['../../'], { fragment: 'observations', relativeTo: this.route });
      },
      reason => {
        this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
        this.router.navigate(['../../'], { fragment: 'observations', relativeTo: this.route });
      }
    );
  }

  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return `with: ${reason}`;
    }
  }
}
