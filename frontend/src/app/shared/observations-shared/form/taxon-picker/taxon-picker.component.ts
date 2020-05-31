/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  Component,
  ViewEncapsulation,
  ChangeDetectionStrategy,
  Input,
  ViewChild,
  Output,
  EventEmitter,
  Inject,
  LOCALE_ID,
  SimpleChanges,
  OnChanges,
  forwardRef,
  ElementRef
} from '@angular/core';
import { Subject, Observable, merge, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, tap, map, catchError } from 'rxjs/operators';

import { NgbTypeahead, NgbTypeaheadSelectItemEvent } from '@ng-bootstrap/ng-bootstrap';

import { Taxon } from '@models/taxonomy.model';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

type AutoCompletionResults = {
  [name: string]: string;
}[];

function getKey<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

@Component({
  selector: 'app-taxon-picker',
  templateUrl: './taxon-picker.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TaxonPickerComponent),
      multi: true
    }
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaxonPickerComponent implements ControlValueAccessor, OnChanges {
  @Input() autocompleteMaxResults = 10;
  @Input() autocompleteDebounceResults = 200;
  @Input() autoCompleteFields = ['nom_complet', 'nom_vern', 'nom_vern_eng', 'cd_nom'];
  @Input() taxa!: Taxon[];
  @ViewChild('taxonAutoCompleteInput') taxonAutoCompleteInput!: NgbTypeahead;
  @ViewChild('cdnom', { static: true }) cdnom!: ElementRef<HTMLInputElement>;
  @Output() taxonSelected: EventEmitter<Partial<Taxon>> = new EventEmitter();
  inputAutoCompleteFocus$ = new Subject<string>();

  searchingTaxon = false;
  taxonSearchFailed = false;

  species: { [name: string]: string }[] = [];
  selectedTaxon: Partial<Taxon> | undefined;

  inputAutoCompleteSearch = (text$: Observable<string>): Observable<AutoCompletionResults> => {
    return merge(text$, this.inputAutoCompleteFocus$).pipe(
      debounceTime(this.autocompleteDebounceResults),
      distinctUntilChanged(),
      tap(() => (this.searchingTaxon = true)),
      map(term =>
        term === '' // term.length < n
          ? this.species.slice(0, this.autocompleteMaxResults) // []
          : this.species
              .filter(
                value => new RegExp(term, 'gi').test(value['name'])
                // v => v["name"].toLowerCase().indexOf(term.toLowerCase()) > -1
              )
              .slice(0, this.autocompleteMaxResults)
      ),
      tap(() => {
        this.taxonSearchFailed = false;
        this.searchingTaxon = false;
      }),
      catchError(() => {
        this.taxonSearchFailed = true;
        return of([]);
      })
    );
  };

  inputAutoCompleteFormatter = (x: { name: string }): string => x.name;

  inputAutoCompleteSetup(): void {
    for (const taxon of this.taxa) {
      if (!taxon) {
        const msg = 'No taxon for inputAutoCompleteSetup().';
        console.error(msg);
        return;
      }
      let str = '';
      const taxonAutoCompletableProps: { [key: string]: Partial<Taxon[keyof Taxon]> } = {};
      for (const field of this.autoCompleteFields as [keyof Taxon]) {
        if (field in taxon) {
          const val = getKey(taxon, field);
          taxonAutoCompletableProps[field] = val;
          str += ` \n${val}`;
        }
      }
      this.species.push({
        ...taxonAutoCompletableProps,
        name: str,
        cd_nom: taxon.cd_nom.toString(),
        icon: taxon.media?.length > 0 ? taxon.media[0].thumb_url : 'assets/default_taxon.jpg'
      });
    }
  }

  private onChange = (_value: string | null): void => {};
  private onTouched = (): void => {};

  writeValue(value: string | null): void {
    if (value) {
      this.cdnom.nativeElement.value = value;
    }
  }

  registerOnChange(fn: (val: string | null) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  constructor(@Inject(LOCALE_ID) readonly localeId: string) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.taxa && changes.taxa.currentValue && changes.taxa.firstChange && this.taxa) {
      this.inputAutoCompleteSetup();
    }
  }

  onTaxonSelected(
    selected: /* { item: Partial<Taxon> & { icon: string } } */
    NgbTypeaheadSelectItemEvent | Partial<Taxon>
  ): void {
    this.onTouched();
    if ('item' in selected) {
      this.selectedTaxon = selected.item;
      this.writeValue(selected.item.cd_nom);
      this.onChange(selected.item.cd_nom);
      /* this.taxonSelected.emit(selected.item); */
    }
  }
}
