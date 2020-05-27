import { Component, Input, ViewChild, ViewEncapsulation } from '@angular/core';

import { FlowComponentInterface } from '@shared/observations-shared/modalflow/flow/flow';
import { ObsFormComponent } from '@shared/observations-shared/form/form.component';
import { ObsPostResponsePayload, SharedContext } from '@features/observations/observation.model';

@Component({
  templateUrl: './committed.component.html',
  encapsulation: ViewEncapsulation.None
})
export class CommittedComponent implements FlowComponentInterface {
  @ViewChild(ObsFormComponent) form?: ObsFormComponent;
  @Input() data!: SharedContext;
  newData: (SharedContext & { obs: ObsPostResponsePayload }) | undefined;

  observationSubmitted(observation: ObsPostResponsePayload): void {
    if (observation) {
      this.newData = { obs: observation, ...this.data };

      const event: CustomEvent = new CustomEvent('NewObservationEvent', {
        bubbles: true,
        cancelable: true,
        detail: this.newData.obs
      });
      document.dispatchEvent(event);

      this.data.next(this.newData);
    }
  }

  committed(): void {
    console.debug('submitting');
    this.form?.onFormSubmit();
  }
}
