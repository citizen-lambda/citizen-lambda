import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, Subject, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

import { AppConfig } from '../../../conf/app.config';
import { AuthService } from '../../services/auth.service';
import { UserInfo, Badge, RewardsApiPayload } from '../../core/models';
import { FeatureCollection } from 'geojson';

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
  badges: Badge[][] = [];
  badges$: Subject<Badge[][]> = new Subject<Badge[][]>();
  errorMessage = '';

  constructor(
    private auth: AuthService,
    private client: HttpClient,
    private router: Router,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
      this.auth
        .ensureAuthorized()
        .pipe(
          tap(user => {
            if (!!user && !!user.features) {
              this.isLoggedIn = true;
              this.username = user.features.username;
              this.stats = user.features.stats;
              this.role_id = user.features.id_role;
              // FIXME: source backend conf
              if (AppConfig.REWARDS) {
                this.getBadgeCategories().subscribe();
              }
            }
          }),
          catchError(err => throwError(err))
        )
        .subscribe();
    }
  }

  deletePersonalData(): void {
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
      this.auth
        .selfDeleteAccount(accessToken)
        .then(data => {
          this.auth.logout();
          const getBackHome = confirm(`${data.message}\nRevenir à l'accueil ?`);
          if (getBackHome) {
            this.router.navigate(['/home']);
          }
        })
        .catch(err => alert(err));
    }
  }

  getPersonalInfo(): Observable<UserInfo> {
    const url = `${AppConfig.API_ENDPOINT}/user/info`;
    return this.client.get<UserInfo>(url, { headers: this.headers });
  }

  exportPersonalData(): void {
    this.getPersonalInfo().subscribe(data => {
      alert(JSON.stringify(data));
    });
  }

  getPersonalObs(): Observable<FeatureCollection> {
    const url = `${AppConfig.API_ENDPOINT}/observations`;
    return this.client.get<FeatureCollection>(url, {
      headers: this.headers,
      responseType: 'blob' as 'json'
    });
  }

  exportPersonalObs(): void {
    this.getPersonalObs().subscribe(data => {
      const date = new Date();
      const geoJSon: string[] = [];
      geoJSon.push(data.toString());
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(new Blob(geoJSon, { type: data.type }));
      link.setAttribute('download', `export-${date.toISOString()}.geojson`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
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
    this.client
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

  getBadgeCategories(): Observable<object> {
    return this.client
      .get<RewardsApiPayload>(`${AppConfig.API_ENDPOINT}/dev_rewards/${this.role_id}`)
      .pipe(
        tap(data => {
          const categories: { [name: string]: Badge[] } = data['badges'].reduce(
            (acc: { [name: string]: Badge[] }, item: Badge) => {
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
