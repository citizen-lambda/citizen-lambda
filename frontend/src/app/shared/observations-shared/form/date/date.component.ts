import {
  Component,
  ChangeDetectionStrategy,
  ViewEncapsulation,
  OnInit,
  Input,
  TemplateRef
} from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import {
  NgbDate,
  NgbDateAdapter,
  NgbDateNativeUTCAdapter,
  NgbDateParserFormatter
} from '@ng-bootstrap/ng-bootstrap';
import { DayTemplateContext } from '@ng-bootstrap/ng-bootstrap/datepicker/datepicker-day-template-context';
import { CustomDateParserFormatter } from './parser-formatter';

@Component({
  selector: 'app-date',
  templateUrl: './date.component.html',
  providers: [
    { provide: NgbDateAdapter, useClass: NgbDateNativeUTCAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter }
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DateComponent implements OnInit {
  @Input() parentForm: FormGroup | undefined;
  @Input() default: string | Date | undefined;
  @Input() disabledNgbDates: ((date: NgbDate) => boolean) | undefined;
  @Input() specialDay: TemplateRef<DayTemplateContext> | undefined;
  defaultDate: Date;
  defaultNgbDate: NgbDate;

  date: FormControl;

  constructor() {
    this.defaultDate = this.default ? new Date(this.default) : new Date();
    this.defaultNgbDate = new NgbDate(
      this.defaultDate.getFullYear(),
      this.defaultDate.getMonth() + 1,
      this.defaultDate.getDate()
    );
    this.date = new FormControl({
      date: [this.defaultNgbDate]
    });
  }

  ngOnInit(): void {
    this.date.setValue(this.defaultNgbDate);
    this.parentForm?.addControl('date', this.date);
  }
}
