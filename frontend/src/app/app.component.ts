import { Component, ViewEncapsulation } from "@angular/core";

import { IAppConfig } from "./core/models";
import { AppConfig } from "../conf/app.config";

type AppConfigApp = Pick<IAppConfig, "FRONTEND">;

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
  encapsulation: ViewEncapsulation.None
})
export class AppComponent {
  title = "GeoNature-citizen";
  public AppConfig: AppConfigApp = AppConfig;
}
