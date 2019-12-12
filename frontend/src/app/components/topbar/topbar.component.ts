import {
  Component,
  OnInit,
  ViewEncapsulation,
  AfterViewInit,
  LOCALE_ID,
  Inject
} from '@angular/core';
import { ActivatedRoute, Data } from '@angular/router';
import { Observable, Subject, throwError, BehaviorSubject } from 'rxjs';
import { tap, map, catchError, filter } from 'rxjs/operators';

import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

import { AppConfig } from '../../../conf/app.config';
import { AuthService } from '../../services/auth.service';
import { LoginComponent } from '../login/login.component';
import { LogoutComponent } from '../logout/logout.component';
import { RegisterComponent } from '../register/register.component';
import { Program } from '../../features/programs/programs.models';
import { GncProgramsService } from '../../features/programs/gnc-programs.service';
import { ProgramsComponent } from '../../features/programs/programs.component';

@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class TopbarComponent implements OnInit, AfterViewInit {
  title: string = AppConfig.appName;
  collapsed = true;
  username = 'Anonymous';
  modalRef!: NgbModalRef;
  programs$ = new Subject<Program[] | null>();
  // FIXME: isAdmin$ topbar updates
  isAdmin$ = new BehaviorSubject<boolean>(false);
  languages = [
    { code: 'en', label: 'English' },
    { code: 'fr', label: 'Français' }
  ];

  constructor(
    @Inject(LOCALE_ID) public localeId: string,
    private route: ActivatedRoute,
    private programService: GncProgramsService,
    private auth: AuthService,
    private modalService: NgbModal
  ) {}

  isLoggedIn$(): Observable<boolean> {
    return this.auth.authorized$.pipe(
      map(value => {
        if (value === true) {
          this.username = localStorage.getItem('username') || this.username;
        }
        return value;
      })
    );
  }

  login() {
    this.modalRef = this.modalService.open(LoginComponent, {
      size: 'lg',
      centered: true
    });
  }

  register() {
    this.modalRef = this.modalService.open(RegisterComponent, {
      size: 'lg',
      centered: true
    });
  }

  logout() {
    this.modalRef = this.modalService.open(LogoutComponent, {
      size: 'lg',
      centered: true
    });
  }

  programs() {
    this.modalRef = this.modalService.open(ProgramsComponent, {
      size: 'xl',
      centered: true
    });
  }

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    const access_token = localStorage.getItem('access_token');
    if (access_token) {
      this.auth
        .ensureAuthorized()
        .pipe(
          tap(user => {
            if (user && user['features'] && user['features'].id_role) {
              this.username = user['features'].username;
              this.isAdmin$.next(user['features'].admin);
            }
          }),
          catchError(err => {
            console.error(err);
            this.auth
              .logout()
              .then(logout => {
                console.log('Logout Status:', logout.status);
              })
              .catch(error => {
                console.error('Logout error:', error);
              });
            return throwError(err);
          })
        )
        .subscribe();
    } else {
      this.username = localStorage.getItem('username') || 'Anonymous';
    }

    this.auth.authorized$
      .pipe(
        filter(status => !!!status),
        map(_ => this.isAdmin$.next(false))
      )
      .subscribe();

    this.route.data
      .pipe(
        tap((data: Data) => {
          if (data && data.programs) {
            this.programs$.next(data.programs);
          } else {
            this.programService.getAllPrograms().subscribe(programs => {
              this.programs$.next(programs);
            });
          }
        }),
        catchError(error => throwError(error))
      )
      .subscribe();
  }

  close(d: string) {
    this.modalRef.close(d);
  }
}
