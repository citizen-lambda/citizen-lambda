import { AuthService } from "./../auth.service";
import { Component } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: "app-logout",
  templateUrl: "./logout.component.html",
  styleUrls: ["./logout.component.css"]
})
export class LogoutComponent {
  constructor(private auth: AuthService, public activeModal: NgbActiveModal) {}

  onLogout(): void {
    const access_token = localStorage.getItem("access_token");
    if (access_token) {
      this.auth
        .logout()
        .then(logout => {
          console.log("LogoutUser Get Status", logout.status);
        })
        .catch(err => {
          console.log(err);
        });
      this.activeModal.close();
    }
  }
}
