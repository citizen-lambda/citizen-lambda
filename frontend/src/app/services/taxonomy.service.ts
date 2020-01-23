import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';
import { map, catchError, tap, share } from 'rxjs/operators';
import { Observable, of } from 'rxjs';

import { AppConfig } from '../../conf/app.config';

import { Taxon } from '../core/models';

export type UnsafeTaxon = Taxon & { nom_complet_html: string };

@Injectable({
  providedIn: 'root'
})
export class TaxonomyService {
  private readonly URL = AppConfig.API_ENDPOINT;
  taxa: { [key: number]: Taxon } = {};
  offList: { [key: number]: Observable<Taxon> } = {};

  constructor(protected client: HttpClient, protected domSanitizer: DomSanitizer) {}

  getTaxon(cd_nom: number): Observable<Taxon> {
    if (!!this.taxa[cd_nom]) {
      return of(this.taxa[cd_nom]);
    }
    if (!this.offList[cd_nom]) {
      this.offList[cd_nom] = this.client.get<UnsafeTaxon>(`${this.URL}/taxref/${cd_nom}`).pipe(
        map(unsafeTaxon => {
          return {
            ...unsafeTaxon,
            ...{
              nom_complet_html: this.domSanitizer.bypassSecurityTrustHtml(
                unsafeTaxon.nom_complet_html
              )
            }
          };
        }),
        tap(taxon => (this.taxa[taxon.cd_nom] = taxon)),
        // tap(taxon => console.debug(`fetched Taxon::${taxon.cd_nom}`)),
        share(),
        catchError(this.handleError<Taxon>(`getTaxon::${cd_nom}`, {} as Taxon))
      );
    }
    return this.offList[cd_nom];
  }

  private handleError<T>(operation = 'operation', defaultValue?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed: ${error.message}`, error);
      return of(defaultValue as T);
    };
  }
}
