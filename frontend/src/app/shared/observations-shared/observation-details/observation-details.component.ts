import {
  Component,
  OnInit,
  Inject,
  LOCALE_ID,
  Input,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import { PlatformLocation } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { of, BehaviorSubject } from 'rxjs';
import { map, take } from 'rxjs/operators';

import {
  NgbModal,
  ModalDismissReasons,
  NgbActiveModal,
  NgbModalRef
} from '@ng-bootstrap/ng-bootstrap';

import { AppConfig } from '@conf/app.config';
import { Taxon } from '@core/models';
import { ObservationData } from '@features/observations/observation.model';
import { TaxonomyService } from '@services/taxonomy.service';
import { ObservationsFacade } from '@shared/observations-shared/observations-facade.service';
import { WebshareComponent, ShareData } from '@shared/webshare/webshare.component';

@Component({
  selector: 'app-obs-details-modal-content',
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="modal-header">
      <h4 class="modal-title" id="modal-obs-details">
        Details Observation #{{ data?.id_observation }}
      </h4>
      <button
        type="button"
        class="close"
        i18n-aria-label
        aria-label="Close"
        (click)="modal.dismiss('Cross click')"
      >
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
    <div class="modal-body d-flex flex-column" *ngIf="taxon$ | async as taxon">
      <!-- FIXME: hardcoded backend media url -->
      <app-image-top
        [src]="
          data?.images?.length
            ? AppConfig.API_ENDPOINT + '/media/' + data?.images![0]
            : data?.image
            ? data!.image
            : taxon?.media && taxon!.media.length > 0
            ? taxon!.media![0]!.thumb_url
            : 'assets/default_taxon.jpg'
        "
        [alt]="
          !localeId.startsWith('fr') && !!taxon?.nom_vern_eng
            ? taxon?.nom_vern_eng
            : taxon?.nom_vern
            ? taxon?.nom_vern
            : taxon?.nom_valide
        "
      ></app-image-top>
      <div class="obs-added">
        <p>
          {{
            !localeId.startsWith('fr')
              ? !!taxon?.nom_vern_eng
                ? [taxon?.nom_vern_eng, taxon?.nom_vern].join(', ')
                : taxon?.nom_vern
              : [taxon?.nom_vern, taxon?.nom_vern_eng].join(', ')
          }}
        </p>
        <p i18n>Nom complet: {{ taxon?.nom_complet }}</p>
        <p i18n>Dénombrement: {{ data?.count }}</p>
        <p i18n>Date: {{ data?.date | date }}</p>
        <p *ngIf="data?.observer?.username" i18n>Observateur: {{ data?.observer?.username }}</p>
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
        <ng-container *ngIf="canShare()">
          <br />
          <app-webshare [data]="sharedData" (click)="setupShare()" i18n>
            <i class="fa fa-share-alt" aria-hidden="true"></i> Partager</app-webshare
          >
        </ng-container>
      </div>
    </div>
  `
})
export class ObsDetailsModalContentComponent implements OnInit {
  AppConfig = AppConfig;
  navigator: Navigator | null = null;
  @ViewChild(WebshareComponent) shareButton?: WebshareComponent;
  sharedData: ShareData = {};
  @Input() data: Partial<ObservationData> | undefined;
  taxon$ = new BehaviorSubject<(Partial<ObservationData> & Taxon) | undefined>(undefined);

  constructor(
    @Inject(LOCALE_ID) public localeId: string,
    public modal: NgbActiveModal,
    public taxonService: TaxonomyService
  ) {
    this.navigator = window.navigator;
  }

  ngOnInit(): void {
    of(this.data).subscribe(data => {
      if (!!data && data.cd_nom) {
        this.taxonService.getTaxon(data.cd_nom).subscribe(t => {
          this.taxon$.next({ ...t, ...data });
        });
      }
    });
  }

  canShare(): boolean {
    return !!this.navigator && 'share' in this.navigator;
  }

  setupShare(): void {
    if (this.data) {
      let url = document.location.href;
      const canonicalElement = document.querySelector('link[rel=canonical]');
      if (canonicalElement !== null) {
        url = canonicalElement.getAttribute('href') as string;
      }
      this.sharedData = {
        title: `${document.title} Details Observation #${this.data.id_observation}`,
        text: this.data.comment,
        url
      };
    }
  }
}

// tslint:disable-next-line: max-classes-per-file
@Component({
  template: ''
})
export class ObservationDetailsComponent implements OnInit {
  modalRef?: NgbModalRef;
  closeResult = '';
  data: Partial<ObservationData> = {};

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private location: PlatformLocation,
    private modalService: NgbModal,
    public facade: ObservationsFacade
  ) {
    location.onPopState(() => {
      if (this.modalRef !== undefined) {
        this.modalRef.close('HISTORYBACK');
      }
    });
  }

  ngOnInit(): void {
    this.route.paramMap.pipe(take(1)).subscribe(params => {
      const obsID = parseInt(params.get('obsid') || '1', 10);
      this.facade.features$
        .pipe(
          map(features =>
            // tslint:disable-next-line: no-non-null-assertion
            features.filter(feature => !!feature && feature.properties?.id_observation === obsID)
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

  onError(error: any): void {
    let msg = error.toString();
    if (error instanceof TypeError) {
      msg = 'Unknown observation';
      window.alert(msg);
    }
    console.error(error);
    this.close(msg);
    this.router.navigate(['../../'], { fragment: 'observations', relativeTo: this.route });
  }

  close(msg: string): void {
    if (this.modalRef) {
      this.modalRef.close(msg);
    }
  }

  open(): void {
    this.modalRef = this.modalService.open(ObsDetailsModalContentComponent, {
      centered: true,
      scrollable: true
    });
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

  private getDismissReason(reason: ModalDismissReasons): string {
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return `with: ${reason}`;
    }
  }
}
