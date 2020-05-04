import {
  Component,
  OnInit,
  ViewEncapsulation,
  AfterViewInit,
  LOCALE_ID,
  Inject
} from '@angular/core';
import { ActivatedRoute, Data, Router, NavigationEnd } from '@angular/router';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { Location, LocationStrategy, PathLocationStrategy } from '@angular/common';
import { Observable, Subject, throwError, BehaviorSubject } from 'rxjs';
import { tap, map, catchError, filter } from 'rxjs/operators';

import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

import { AppConfig } from '../../../conf/app.config';
import { AuthService } from '../../services/auth.service';
import { LoginComponent } from '../login/login.component';
import { LogoutComponent } from '../logout/logout.component';
import { RegisterComponent } from '../register/register.component';
import { Program } from '../../features/programs/programs.models';
import { ProgramsService } from '../../features/programs/programs.service';
import { ProgramsModalComponent } from '../../shared/programs-shared/programs-modal/programs-modal.component';

@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.css'],
  encapsulation: ViewEncapsulation.None,
  animations: [
    trigger('collapse', [
      state(
        'open',
        style({
          opacity: '1'
        })
      ),
      state(
        'closed',
        style({
          opacity: '0',
          display: 'none'
        })
      ),
      transition('closed => open', animate('400ms ease-in')),
      transition('open => closed', animate('100ms ease-out'))
    ])
  ],
  providers: [Location, { provide: LocationStrategy, useClass: PathLocationStrategy }]
})
export class TopbarComponent implements OnInit, AfterViewInit {
  title: string = AppConfig.appName;
  collapsed = true;
  username = 'Anonymous';
  modalRef!: NgbModalRef;
  programs$ = new Subject<Program[] | null>();
  // FIXME: isAdmin$ topbar updates
  isAdmin$ = new BehaviorSubject<boolean>(false);
  // TODO: mv locales array declaration to AppConfig
  languages = [
    { code: 'en', label: 'English' },
    { code: 'fr', label: 'Français' }
  ];
  location = '';
  base_href = '';

  constructor(
    @Inject(LOCALE_ID) public localeId: string,
    private router: Router,
    private route: ActivatedRoute,
    private programService: ProgramsService,
    private auth: AuthService,
    private modalService: NgbModal
  ) {}

  isLoggedIn$(): Observable<boolean> {
    return this.auth.authorized$.pipe(
      map(value => {
        if (value === true) {
          this.username = window.localStorage.getItem('username') || this.username;
        }
        return value;
      })
    );
  }

  login(): void {
    this.collapsed = true;
    this.modalRef = this.modalService.open(LoginComponent, {
      size: 'lg',
      centered: true
    });
  }

  register(): void {
    this.collapsed = true;
    this.modalRef = this.modalService.open(RegisterComponent, {
      size: 'lg',
      centered: true
    });
  }

  logout(): void {
    this.collapsed = true;
    this.modalRef = this.modalService.open(LogoutComponent, {
      size: 'lg',
      centered: true
    });
  }

  programs(): void {
    this.collapsed = true;
    this.modalRef = this.modalService.open(ProgramsModalComponent, {
      size: 'xl',
      centered: true
    });
  }

  ngOnInit(): void {
    this.base_href = document.getElementsByTagName('base').item(0)?.href || '/';
    this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(event => {
      this.location = (event as NavigationEnd).url;
    });
  }

  ngAfterViewInit(): void {
    const accessToken = window.localStorage.getItem('access_token');
    if (accessToken) {
      this.auth
        .ensureAuthorized()
        .pipe(
          tap(user => {
            if (!!user && !!user.features && !!user.features.id_role) {
              this.username = user.features.username;
              this.isAdmin$.next(user.features.admin === true);
            }
          }),
          catchError(err => {
            console.error(err);
            this.auth
              .logout()
              .then(logout => {
                console.log('Logout message:', logout.message);
              })
              .catch(error => {
                console.error('Logout error:', error);
              });
            return throwError(err);
          })
        )
        .subscribe();
    } else {
      this.username = window.localStorage.getItem('username') || 'Anonymous';
    }

    this.auth.authorized$
      .pipe(
        filter(status => !status),
        map(_ => this.isAdmin$.next(false))
      )
      .subscribe();

    this.route.data.pipe(catchError(error => throwError(error))).subscribe((data: Data) => {
      if (data && data.programs) {
        this.programs$.next(data.programs);
      } else {
        this.programService.getAllPrograms().subscribe(programs => {
          this.programs$.next(programs);
        });
      }
    });
  }

  close(d: string): void {
    this.modalRef.close(d);
  }
}
