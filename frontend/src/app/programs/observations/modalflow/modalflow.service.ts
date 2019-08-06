import { Injectable, ElementRef } from "@angular/core";

import {
  NgbModal,
  ModalDismissReasons,
  NgbModalRef,
  NgbModalOptions
} from "@ng-bootstrap/ng-bootstrap";

import { FlowService } from "./flow/flow.service";
import { FlowItem } from "./flow/flow-item";
import { OnboardComponent } from "./steps/onboard/onboard.component";
import { CommittedComponent } from "./steps/committed/committed.component";
import { CongratsComponent } from "./steps/congrats/congrats.component";
import { RewardComponent } from "./steps/reward/reward.component";

export const MODAL_DEFAULTS: NgbModalOptions = {
  size: "lg",
  centered: true
};

@Injectable({
  providedIn: "root"
})
export class ModalFlowService implements FlowService {
  modalRef: NgbModalRef;

  constructor(private modalService: NgbModal) {}

  open(content: ElementRef<any>, options: NgbModalOptions = {}) {
    this.modalRef = this.modalService.open(content, {
      ...MODAL_DEFAULTS,
      ...options
    });
    this.modalRef.result.then(
      result => {
        console.debug("closed with", !!result);
      },
      reason => {
        let trigger = "undefined reason";
        switch (reason) {
          case ModalDismissReasons.BACKDROP_CLICK:
            trigger = "BACKDROP";
            break;
          case ModalDismissReasons.ESC:
            trigger = "ESC";
            break;
          default:
            trigger = reason;
            break;
        }
        console.debug(`dismissed with ${trigger}`);
      }
    );
  }

  next_(data: any) {}

  close(data: string) {
    this.modalRef.close(data);
  }

  getFlowItems(initialState: any) {
    console.debug("getFlowItems", initialState);
    return [
      new FlowItem(OnboardComponent, { ...initialState, service: this }),
      new FlowItem(CommittedComponent, { ...initialState, service: this }),
      new FlowItem(CongratsComponent, { ...initialState, service: this }),
      new FlowItem(RewardComponent, { ...initialState, service: this })
    ];
  }
}
