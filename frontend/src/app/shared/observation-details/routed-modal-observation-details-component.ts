import { Component, OnInit } from '@angular/core';
import { PlatformLocation } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { map, take } from 'rxjs/operators';

import { ModalDismissReasons, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

import { ObservationData } from '@models/observation.model';
import { ObservationsFacade } from '@services/observations-facade.service';
import { ObservationDetailsComponent } from './observation-details.component';

@Component({
  template: ` <app-observation-details></app-observation-details> `
})
export class RoutedModalObservationDetailsComponent implements OnInit {
  modalRef?: NgbModalRef;
  closeResult = '';
  data: Partial<ObservationData> = {};

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private location: PlatformLocation,
    private modalService: NgbModal,
    public observations: ObservationsFacade
  ) {
    this.location.onPopState(() => {
      if (this.modalRef !== undefined) {
        this.modalRef.close('HISTORYBACK');
      }
    });
  }

  ngOnInit(): void {
    this.route.paramMap.pipe(take(1)).subscribe(params => {
      const obsId = parseInt(params.get('obsid') || '1', 10);
      this.observations.features$
        .pipe(
          map(features => features.filter(feature => feature.properties?.id_observation === obsId)),
          take(1)
        )
        .subscribe(features => {
          try {
            this.data = features[0].properties as Partial<ObservationData>;
            this.observations.selected = features[0];
            this.open();
          } catch (error) {
            this.onError(error);
          }
        });
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    this.modalRef = this.modalService.open(ObservationDetailsComponent, {
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
