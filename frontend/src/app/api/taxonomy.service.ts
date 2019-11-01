import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { map, catchError, tap } from 'rxjs/operators';
import { Observable, of, from } from 'rxjs';

import { AppConfig } from '../../conf/app.config';

import { Taxonomy, Taxon } from '../programs/observations/observation.model';

export type UnsafeTaxon = Taxon & { nom_complet_html: string }

@Injectable({
  providedIn: 'root'
})
export class TaxonomyService {
  private readonly URL = AppConfig.API_ENDPOINT;
  taxa: {[key: number]: Taxon} = {};

  constructor(protected client: HttpClient, protected domSanitizer: DomSanitizer) { }

  getTaxon(cd_nom: number): Observable<Taxon> {
    if (this.taxa[cd_nom]) {
      // console.debug(`getTaxon::${cd_nom} data in stock`);
      return of(this.taxa[cd_nom]);
    } else {
      return this.client.get<UnsafeTaxon>(`${this.URL}/taxref/${cd_nom}`).pipe(
        map(unsafeTaxon => {
          const safeTaxon = {
            ...unsafeTaxon,
            ...{ nom_complet_html: this.domSanitizer.bypassSecurityTrustHtml(
              unsafeTaxon.nom_complet_html
              )
            }
          };
          console.debug(`getTaxon::${cd_nom} data is outsourced`);
          this.taxa = {...this.taxa, ...{[safeTaxon.cd_nom]: safeTaxon}};
          return safeTaxon;
      }),
      catchError(this.handleError<Taxon>(`getTaxon::{cd_nom}`, {} as Taxon))
    );
    }
  }

  private handleError<T>(operation = 'operation', defaultValue?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed: ${error.message}`, error);
      return of(defaultValue as T);
    };
  }
}
