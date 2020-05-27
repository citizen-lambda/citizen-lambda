import {
  Component,
  OnInit,
  ViewEncapsulation,
  LOCALE_ID,
  Inject,
  HostListener,
  ChangeDetectionStrategy
} from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { trigger, state, style, transition, animate, keyframes } from '@angular/animations';
import { Location, LocationStrategy, PathLocationStrategy } from '@angular/common';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';

import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

import { AppConfig } from '@conf/app.config';
import { AuthService } from '@services/auth.service';
import { LoginComponent } from '../login/login.component';
import { LogoutComponent } from '../logout/logout.component';
import { RegisterComponent } from '../register/register.component';
import { ProgramsService } from '@features/programs/programs.service';
import { ProgramsModalComponent } from '@shared/programs-shared/programs-modal/programs-modal.component';
import { UserFeatures, AnonymousUser } from '@core/models';
import { UnsubscribeOnDestroy } from '@helpers/unsubscribe-on-destroy';

@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('collapsing', [
      state(
        'open',
        style({
          height: '*',
          opacity: '1'
        })
      ),
      state(
        'closed',
        style({
          // display: 'none',
          height: '0',
          opacity: '0',
          overflow: 'hidden'
        })
      ),
      transition(
        'closed => open',
        animate(
          '2000ms',
          keyframes([
            style({ opacity: 0.1, offset: 0.1 }),
            style({ opacity: 0.6, offset: 0.2 }),
            style({ opacity: 1, offset: 0.5 }),
            style({ opacity: 0.6, offset: 0.8 })
          ])
        )
      ),
      transition('open => closed', [
        style({ height: '*' }),
        animate('800ms', style({ height: 0, opacity: '0' }))
      ])
    ])
  ],
  providers: [Location, { provide: LocationStrategy, useClass: PathLocationStrategy }]
})
export class TopbarComponent extends UnsubscribeOnDestroy implements OnInit {
  title: string = AppConfig.appName;
  collapsed = true;
  username = new AnonymousUser(this.localeId).username;
  modalRef: NgbModalRef | undefined;
  // TODO: get locales array from AppConfig
  languages = [
    { code: 'en', label: 'English' },
    { code: 'fr', label: 'Français' }
  ];
  location = '';
  base_href = '';

  userAuthState$: Observable<AnonymousUser | UserFeatures> = this.auth.userAuthState$;

  constructor(
    @Inject(LOCALE_ID) public localeId: string,
    private router: Router,
    private modalService: NgbModal,
    private auth: AuthService,
    public programService: ProgramsService
  ) {
    super();
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

  programsModal(): void {
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

  close(d: string): void {
    this.modalRef?.close(d);
  }

  @HostListener('window:scroll')
  scrollHandler(): void {
    if (document.body.scrollTop > 0 || document.documentElement.scrollTop > 0) {
      const tallSize = getComputedStyle(document.documentElement)
        .getPropertyValue('--tall-topbar-height')
        .trim();
      const narrowSize = getComputedStyle(document.documentElement)
        .getPropertyValue('--narrow-topbar-height')
        .trim();
      const offset = getComputedStyle(document.documentElement)
        .getPropertyValue('--router-outlet-margin-top')
        .trim();
      const barSize = parseInt(offset, 10) - document.documentElement.scrollTop;
      const minSize = parseInt(narrowSize, 10);
      const maxSize = parseInt(tallSize, 10);
      document.documentElement.style.setProperty(
        '--router-outlet-margin-top',
        Math.min(Math.max(barSize, minSize), maxSize) + 'px'
      );
    } else {
      document.documentElement.style.setProperty(
        '--router-outlet-margin-top',
        'var(--tall-topbar-height)'
      );
    }
  }
}
