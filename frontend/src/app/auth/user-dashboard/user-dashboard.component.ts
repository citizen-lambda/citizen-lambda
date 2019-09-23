import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, Subject, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

import { AppConfig } from '../../../conf/app.config';
import { AuthService } from './../auth.service';

@Component({
  selector: 'app-user-dashboard',
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.component.css']
})
export class UserDashboardComponent implements OnInit {
  private headers: HttpHeaders = new HttpHeaders({
    'Content-Type': 'application/json'
  });
  readonly AppConfig = AppConfig;
  modalRef!: NgbModalRef;
  username = 'not defined';
  role_id: number | null = null;
  isLoggedIn = false;
  stats: any;
  personalInfo: { [name: string]: any } = {};
  badges: { img: string; alt: string }[] = [];
  badges$: Subject<Object> = new Subject<Object>();
  errorMessage = '';

  constructor(
    private auth: AuthService,
    private http: HttpClient,
    private router: Router,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    const access_token = localStorage.getItem('access_token');
    if (access_token) {
      this.auth
        .ensureAuthorized()
        .pipe(
          tap(user => {
            if (user) {
              this.isLoggedIn = true;
              this.username = user.features.username;
              this.stats = user.features.stats;
              this.role_id = user.features.id_role;
              // FIXME: source backend conf
              if (AppConfig['REWARDS']) {
                this.getBadgeCategories().subscribe();
              }
            }
          }),
          catchError(err => throwError(err))
        )
        .subscribe();
    }
  }

  deletePersonalData() {
    const access_token = localStorage.getItem('access_token');
    if (access_token) {
      this.auth
        .selfDeleteAccount(access_token)
        .then(data => {
          const getBackHome = confirm(
            data.hasOwnProperty('message') ? `${data.message}\nRevenir à l'accueil ?` : data
          );
          if (getBackHome) {
            this.router.navigate(['/home']);
          }
        })
        .catch(err => alert(err));
    }
  }

  getPersonalInfo(): Observable<any> {
    const url = `${AppConfig.API_ENDPOINT}/user/info`;
    return this.http.get(url, { headers: this.headers });
  }

  exportPersonalData() {
    this.getPersonalInfo().subscribe(data => {
      alert(JSON.stringify(data));
      // TODO: data format: csv, geojson ? Link observations and associated medias ?
    });
  }

  editInfos(content: { [name: string]: any }): void {
    this.getPersonalInfo().subscribe(data => {
      this.personalInfo = data;
      this.modalRef = this.modalService.open(content, {
        size: 'lg',
        centered: true
      });
    });
  }

  onUpdatePersonalData(): void | Error {
    this.http
      .post(`${AppConfig.API_ENDPOINT}/user/info`, this.personalInfo, {
        headers: this.headers
      })
      .pipe(
        catchError(error => {
          window.alert(error);
          return throwError(error);
        })
      )
      .subscribe(() => {
        this.modalRef.close();
      });
  }

  getBadgeCategories(): Observable<Object | Error> {
    return this.http
      .get<{ [name: string]: any }>(`${AppConfig.API_ENDPOINT}/dev_rewards/${this.role_id}`)
      .pipe(
        tap(data => {
          const categories: { [name: string]: any } = data['badges'].reduce(
            (acc: { [name: string]: any }, item: { img: string; alt: string }) => {
              const category: string = item['alt'].split(/\.[^/.]+$/)[0];
              if (!acc[category]) {
                acc[category] = data['badges'].filter((props: { img: string; alt: string }) =>
                  props.alt.startsWith(category + '.')
                );
              }
              return acc;
            },
            {}
          );

          Object.values(categories).map(value => this.badges.push(value));
          this.badges$.next(this.badges);
          localStorage.setItem('badges', JSON.stringify(data['badges']));
        }),
        catchError(error => {
          window.alert(error);
          return throwError(error);
        })
      );
  }
}
