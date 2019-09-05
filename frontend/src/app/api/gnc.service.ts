import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
// angular
import { Injectable, ApplicationRef } from '@angular/core';
import { Http, Response } from '@angular/http';
// rxjs
import { of } from 'rxjs';
// config
import { AppConfig } from '../../conf/app.config';
// models
import { Program } from '../programs/programs.models';
import { HttpErrorResponse } from '@angular/common/http';

const API_URL = AppConfig.API_ENDPOINT;
@Injectable({
  providedIn: 'root'
})
export class GncService {
  private readonly URL = AppConfig.API_ENDPOINT;
  state = 0;

  constructor(private app: ApplicationRef) {}

  setState() {
    this.state = Math.random();
    // Run change detection
    this.app.tick();
  }
}
