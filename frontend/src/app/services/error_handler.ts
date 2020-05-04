import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable()
export class ErrorHandler {
  public handleError(error: Error | HttpErrorResponse): void {
    // notification system, once elected, goes here
    let errorMessage = '';
    if (error instanceof HttpErrorResponse) {
      if (!navigator.onLine) {
        // Handle offline error .. to test
        errorMessage = `OffLineError: No connectivity.`;
      } else if (error.status >= 500 && error.status < 600) {
        // Unavailable
        errorMessage = `UnavailableError: ${error.status} - ${error.message}`;
      } else if (error.status !== 0) {
        // tslint:disable-next-line: prefer-conditional-expression
        if (error.error && error.error.message) {
          // api or network-side
          errorMessage = `${error.error.message}`;
        } else {
          // client-side
          errorMessage = `${error.status} - ${error.message}`;
        }
      } else {
        if (error.error instanceof ProgressEvent) {
          errorMessage = 'Backend is unreachable.';
        } else {
          errorMessage = JSON.stringify(error);
        }
      }
    } else {
      console.debug('errorHandler: !ErrorEvent !HttpErrorResponse');
      errorMessage = JSON.stringify(error);
    }
    window.alert(errorMessage);
  }
}
