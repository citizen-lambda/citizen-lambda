import { Inject, LOCALE_ID } from '@angular/core';

export interface User {
  username: string;
}

// export const anonymous = this.localeId.startsWith('fr') ? 'Anonyme' : 'Anonymous';
export class AnonymousUser implements User {
  constructor(@Inject(LOCALE_ID) public localeId: string) {}
  get username(): string {
    return this.localeId.startsWith('fr') ? 'Anonyme' : 'Anonymous';
  }
}

export interface Contact {
  name: string;
  surname: string;
  email: string;
}

export interface UserFeatures {
  id_role: number;
  username: string;
  stats: { [name: string]: string | number };
  admin: boolean;
}
