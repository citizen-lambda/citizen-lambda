import { Injectable, Optional, SkipSelf } from '@angular/core';
import { DomSanitizer, TransferState, makeStateKey } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { Observable, of, Subject } from 'rxjs';
import { catchError, map, mergeMap, pluck, tap } from 'rxjs/operators';

import { FeatureCollection, Feature } from 'geojson';

import { AppConfig } from '../../../conf/app.config';
import { Program } from './programs.models';
import { Taxonomy } from '../../core/models';
import { sorted } from '../../helpers/sorted';

const PROGRAMS_KEY = makeStateKey('programs');

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

  convertFeature2Program(feature: Feature): Program {
    const program = feature.properties as Program;
    program.html_short_desc = this.domSanitizer.bypassSecurityTrustHtml(program.short_desc);
    program.html_long_desc = this.domSanitizer.bypassSecurityTrustHtml(program.long_desc);
    return program;
  }

  getAllPrograms(): Observable<Program[] | null> {
    if (!this.programs) {
      return this.client.get<FeatureCollection>(`${this.URL}/programs`).pipe(
        // FIXME: handle empty|null case -> handleError
        pluck<FeatureCollection, Feature[]>('features'),
        map(features => features.map(feature => this.convertFeature2Program(feature))),
        map(programs => programs.sort(sorted(AppConfig['program_list_sort']))),
        tap(programs => {
          this.state.set(PROGRAMS_KEY, programs as Program[]);
          this.programs$.next(programs);
        })
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

  getProgramStream(): Observable<any[]> {
    return new Observable(observer => {
      const eventSource = new EventSource(`${this.URL}/programs/stream?ngsw-bypass=1`);
      eventSource.addEventListener('message', event => observer.next(event.data));
      eventSource.addEventListener('update', event => {
        console.log(event);
      });
      eventSource.addEventListener('error', _error => {
        if (eventSource.readyState !== eventSource.CONNECTING) {
          observer.error('An error occurred.');
        }
        eventSource.close();
        observer.complete();
      });

      return () => {
        eventSource.close();
      };
    });
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
