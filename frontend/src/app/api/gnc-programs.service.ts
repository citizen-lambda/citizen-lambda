import { Injectable, Optional, SkipSelf, OnInit } from '@angular/core';
import { DomSanitizer, TransferState, makeStateKey } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { Observable, of, Subject } from 'rxjs';
import { catchError, map, mergeMap, pluck, tap } from 'rxjs/operators';

import { FeatureCollection, Feature } from 'geojson';

import { AppConfig } from '../../conf/app.config';
import { Program } from '../programs/programs.models';
import { Taxonomy } from '../observations/observation.model';
import { sorted } from '../helpers/sorted';

const PROGRAMS_KEY = makeStateKey('programs');

export interface IGncProgram extends Feature {
  properties: Program;
}

export interface IGncFeatures extends FeatureCollection {
  features: IGncProgram[];
  count: number;
}

@Injectable({
  deps: [
    [new Optional(), new SkipSelf(), GncProgramsService],
    HttpClient,
    TransferState,
    DomSanitizer
  ],
  providedIn: 'root',
  useFactory: (
    instance: GncProgramsService | null,
    client: HttpClient,
    state: TransferState,
    domSanitizer: DomSanitizer
  ) => instance || new GncProgramsService(client, state, domSanitizer)
})
export class GncProgramsService {
  private readonly URL = AppConfig.API_ENDPOINT;
  programs: Program[] | null;
  programs$ = new Subject<Program[] | null>();

  constructor(
    protected client: HttpClient,
    private state: TransferState,
    protected domSanitizer: DomSanitizer
  ) {
    this.programs = this.state.get(PROGRAMS_KEY, null);
    this.programs$.next(this.programs);
  }

  getAllPrograms(): Observable<Program[] | null> {
    if (!this.programs || this.programs.length >= 1) {
      return this.client.get<IGncFeatures>(`${this.URL}/programs`).pipe(
        pluck('features'),
        map((features: IGncProgram[]) => features.map(feature => feature.properties)),
        map((programs: Program[]) =>
          programs.map(program => {
            program.html_short_desc = this.domSanitizer.bypassSecurityTrustHtml(program.short_desc);
            program.html_long_desc = this.domSanitizer.bypassSecurityTrustHtml(program.long_desc);
            return program;
          })
        ),
        map(programs => programs.sort(sorted(AppConfig['program_list_sort']))),
        tap(programs => {
          this.state.set(PROGRAMS_KEY, programs as Program[]);
          this.programs$.next(programs);
        }),
        // catchError(this.handleError<Program[]>('getAllPrograms', []))
      );
    } else {
      return this.programs$;
    }
  }

  getProgram(id: number): Observable<FeatureCollection> {
    return this.client.get<FeatureCollection>(`${this.URL}/programs/${id}`).pipe(
      catchError(
        this.handleError<FeatureCollection>(`getProgram::[${id}]`, {
          type: 'FeatureCollection',
          features: []
        })
      )
    );
  }

  getProgramObservations(id: number): Observable<FeatureCollection> {
    return this.client.get<FeatureCollection>(`${this.URL}/programs/${id}/observations`).pipe(
      catchError(
        this.handleError<FeatureCollection>(`getProgramObservations::[${id}]`, {
          type: 'FeatureCollection',
          features: []
        })
      )
    );
  }

  getProgramTaxonomyList(program_id: number): Observable<Taxonomy> {
    return this.getAllPrograms().pipe(
      // tslint:disable-next-line: no-non-null-assertion
      map(programs => programs!.find(p => p.id_program === program_id)),
      mergeMap(program =>
        this.client.get<Taxonomy>(
          // tslint:disable-next-line: no-non-null-assertion
          `${this.URL}/taxonomy/lists/${program!.taxonomy_list}/species`
        )
      ),
      catchError(this.handleError<Taxonomy>(`getProgramTaxonomyList::[${program_id}]`, {}))
    );
  }

  private handleError<T>(operation = 'operation', defaultValue?: T) {
    return (error: any): Observable<T> => {
      // API errors are caught within the interceptor and handled by our
      // ErrorHandler in frontend/src/app/api/error_handler.ts .
      console.error(`${operation} failed: ${error.message ? error.message : error}`);
      return of(defaultValue as T);
    };
  }

  // public createProgram(program: Program): Observable<Program> {
  //   return this.client
  //     .post<Program>(`${this.URL}/programs`, program)
  //     .map(response => response.json() || []);
  // }

  // public updateProgram(program: Program): Observable<Program> {
  // return this.client
  //   .put<Program>(`${this.URL}/programs/${program.id_program}`, program)
  //   .map(response => response.json() || []);
  // }

  // public deleteProgram(program: Program): Observable<Program> {
  //   return this.client
  //     .delete<Program>(`${this.URL}/programs/${program.id_program}`)
  //     .map(response => response.json() || []);
  // }
}
