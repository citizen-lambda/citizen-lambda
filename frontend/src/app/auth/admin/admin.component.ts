import {
  Component,
  OnInit,
  ViewEncapsulation
  // Inject,
  // LOCALE_ID
} from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { DomSanitizer, SafeUrl } from "@angular/platform-browser";

import { AppConfig } from "../../../conf/app.config";
import { AuthService } from "../auth.service";

@Component({
  selector: "app-admin",
  template: `
    <section>
      <iframe
        id="admin"
        [src]="adminUrl"
        sandbox="allow-forms allow-popups allow-scripts allow-top-navigation"
      ></iframe>
    </section>
  `,
  styleUrls: ["./admin.component.css"],
  encapsulation: ViewEncapsulation.None
})
export class AdminComponent implements OnInit {
  adminUrl: SafeUrl = "";

  constructor(
    // @Inject(LOCALE_ID) readonly localeId: string,
    private auth: AuthService,
    private sanitizer: DomSanitizer,
    protected http: HttpClient
  ) {}

  ngOnInit() {
    /*
      WARNING: We must keep ADMIN_ENDPOINT aligned with API_ENDPOINT for now
      ... until we ...
      TODO: endow our backend with a login system of some sort.
      As of today, our access token is passed as parameter in a GET request
      and that makes it exposed if these endpoints do not share the same encrypted
      https tunnel or certificate.
    */
    const ADMIN_ENDPOINT = [
      AppConfig.API_ENDPOINT,
      // this.localeId,
      "admin",
      ""
    ].join("/");
    const PROGRAM_ENDPOINT = ADMIN_ENDPOINT + "programsmodel/";
    this.adminUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      PROGRAM_ENDPOINT + "?jwt=" + this.auth.getAccessToken()
    );
  }
}
