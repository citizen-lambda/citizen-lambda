import { Component, Input } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: "app-desc-modal",
  templateUrl: "./desc-modal.component.html",
  styleUrls: ["./desc-modal.component.css"]
})
export class DescModalComponent {
  @Input()
  title: string | undefined;
  @Input()
  long_desc: string | undefined;

  constructor(public activeModal: NgbActiveModal) {}
}
