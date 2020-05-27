import { Injectable, Inject, LOCALE_ID } from '@angular/core';
import { formatDate } from '@angular/common';
import { NgbDateParserFormatter, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';

@Injectable()
export class CustomDateParserFormatter extends NgbDateParserFormatter {
  constructor(@Inject(LOCALE_ID) readonly localeId: string) {
    super();
  }

  parse(value: string): NgbDateStruct | null {
    if (value) {
      try {
        const date = new Date(value);
        return {
          year: date.getFullYear(),
          month: date.getMonth() + 1,
          day: date.getDate()
        };
      } catch (error) {
        console.error(error);
        return null;
      }
    }
    return null;
  }

  format(someNgbDate: NgbDateStruct | null): string {
    const date = someNgbDate
      ? new Date(someNgbDate.year, someNgbDate.month - 1, someNgbDate.day)
      : null;
    return date ? formatDate(date, 'mediumDate', this.localeId) : '';
  }
}
