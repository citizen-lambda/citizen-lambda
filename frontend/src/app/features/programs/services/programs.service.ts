import { Injectable } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, mergeMap, pluck, shareReplay } from 'rxjs/operators';

import { FeatureCollection, Feature } from 'geojson';

import { AppConfig } from '@conf/app.config';
import { Program } from '@models/programs.models';
import { Taxonomy } from '@models/taxonomy.model';
import { sorted } from '@helpers/sorted';

// const PROGRAMS_KEY = makeStateKey('programs');

@Injectable({
  providedIn: 'root'
})
export class ProgramsService {
  private readonly URL = AppConfig.API_ENDPOINT;

  programs$ = this.getAllPrograms().pipe(shareReplay(1), catchError(this.handleError));

  constructor(protected client: HttpClient, protected domSanitizer: DomSanitizer) {}

  feature2Program(feature: Feature): Program {
    const program = feature.properties as Program;
    program.html_short_desc = this.domSanitizer.bypassSecurityTrustHtml(program.short_desc);
    program.html_long_desc = this.domSanitizer.bypassSecurityTrustHtml(program.long_desc);
    return program;
  }

  getAllPrograms(): Observable<Program[] | null> {
    return this.client.get<FeatureCollection>(`${this.URL}/programs`).pipe(
      pluck<FeatureCollection, Feature[]>('features'),
      map(features => features.map(feature => this.feature2Program(feature))),
      map(programs => programs.sort(sorted(AppConfig.program_list_sort))),
      catchError(this.handleError<Program[]>(`getAllProgram`, []))
    );
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

  getProgramStream(): Observable<MessageEvent['data']> {
    return new Observable(observer => {
      const eventSource = new EventSource(`${this.URL}/programs/stream?ngsw-bypass=1`);
      const errorListener = (error: Event): void => {
        if (eventSource.readyState !== eventSource.CONNECTING) {
          observer.error(error);
          eventSource.close();
          observer.complete();
        }
      };
      const updateListener = (event: Event): void => {
        console.info('SSE update:', event);
      };
      const messageListener = (event: MessageEvent): void => {
        observer.next(event.data);
      };
      eventSource.addEventListener('message', messageListener);
      eventSource.addEventListener('update', updateListener);
      eventSource.addEventListener('error', errorListener);

      return (): void => {
        eventSource.removeEventListener('message', messageListener);
        eventSource.removeEventListener('update', updateListener);
        eventSource.removeEventListener('error', errorListener);
        console.debug('SSE: closing');
        eventSource.close();
      };
    });
  }

  getProgramTaxonomyList(programId: number): Observable<Taxonomy> {
    return this.programs$.pipe(
      mergeMap(programs => {
        const program = programs?.find(p => +p.id_program === +programId);
        return this.client.get<Taxonomy>(
          `${this.URL}/taxonomy/lists/${program?.taxonomy_list}/species`
        );
      }),
      catchError(this.handleError<Taxonomy>(`getProgramTaxonomyList::[${programId}]`, {}))
    );
  }

  private handleError<T>(operation = 'operation', defaultValue?: T) {
    return (error: Error): Observable<T> => {
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
