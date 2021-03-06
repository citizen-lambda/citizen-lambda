import { Component, Input, ViewChild, ViewEncapsulation, AfterContentChecked } from '@angular/core';

import { FlowComponentInterface } from '@shared/flow/flow';
import { ObsFormComponent } from '@shared/observations-shared/form/form.component';
import { ObsPostResponsePayload, SharedContext } from '@models/observation.model';

@Component({
  templateUrl: './committed.component.html',
  encapsulation: ViewEncapsulation.None
})
export class CommittedComponent implements FlowComponentInterface, AfterContentChecked {
  @ViewChild(ObsFormComponent) form?: ObsFormComponent;
  @Input() data!: SharedContext;
  newData: (SharedContext & { obs: ObsPostResponsePayload }) | undefined;
  formBodyHeight: number | undefined;

  ngAfterContentChecked(): void {
    const modalContentHeight = document.querySelector(
      'body > ngb-modal-window > div > div.modal-content'
    )?.clientHeight;
    // body > ngb-modal-window > div[role="document"].modal-dialog > div.modal-content > app-flow
    const modalHeaderHeight = document.querySelector('app-flow > ng-component > div.modal-header')
      ?.clientHeight;
    const modalFooterHeight = document.querySelector('app-flow > ng-component > div.modal-footer')
      ?.clientHeight;
    if (modalContentHeight && modalHeaderHeight && modalFooterHeight) {
      // TODO: min(~95% windowHeight , modalBody)
      this.formBodyHeight = modalContentHeight - modalHeaderHeight - modalFooterHeight;
    }
  }

  observationSubmitted(observation: ObsPostResponsePayload): void {
    if (observation) {
      this.newData = { obs: observation, ...this.data };

      const event: CustomEvent = new CustomEvent('NewObservationEvent', {
        bubbles: true,
        cancelable: true,
        detail: this.newData.obs
      });
      document.dispatchEvent(event);

      const submitEvent: CustomEvent = new CustomEvent('ObservationSubmittedEvent', {
        bubbles: true,
        cancelable: true,
        detail: this.newData.obs
      });
      document.dispatchEvent(submitEvent);

      this.data.next(this.newData);
    }
  }

  committed(): void {
    console.debug('submitting');
    this.form?.onFormSubmit();
  }
}
