import { Injectable } from "@angular/core";
import { HttpErrorResponse } from "@angular/common/http";

@Injectable()
export class ErrorHandler {
  constructor() {}

  public handleError(error: Error | HttpErrorResponse) {
    // notification system, once elected, goes here
    let errorMessage = "";
    if (error instanceof HttpErrorResponse) {
      if (!navigator.onLine) {
        // Handle offline error .. to test
        errorMessage = `OffLineError: No connectivity.`;
      } else if (error.status !== 0) {
        // client-side or network
        errorMessage = `${error.status} - ${error.message}`;
      } else {
        errorMessage = JSON.stringify(error);
      }
    } else {
      console.debug("errorHandler: !ErrorEvent !HttpErrorResponse");
      errorMessage = JSON.stringify(error);
    }
    window.alert(errorMessage);
  }
}
