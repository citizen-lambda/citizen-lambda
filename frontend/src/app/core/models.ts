import { SafeHtml } from '@angular/platform-browser';
import { Inject, LOCALE_ID } from '@angular/core';

export interface AppConfigInterface {
  appName: string;
  API_ENDPOINT: string;
  URL_APPLICATION: string;
  FRONTEND: {
    PROD_MOD: boolean;
    DISPLAY_FOOTER: boolean;
  };
  ALLOWED_EXTENSIONS: string[]; // TODO: validate media (ext?) for obs submission
  REWARDS?: true;
  SEO: {
    description: {
      fr: string;
      en: string;
    };
    keywords?: {
      fr: string;
      en: string;
    };
    author: string;
    [key: string]: any;
  };
  termsOfUse: {
    fr: string;
    en: string;
  };
  // TODO: platform meta description per locales
  platform_intro: {
    fr: string;
    en: string;
  };
  platform_greeter: {
    fr: string;
    en: string;
  };
  platform_participate: {
    fr: string;
    en: string;
  };
  program_share_an_observation: {
    fr: string;
    en: string;
  };
  program_add_an_observation: {
    fr: string;
    en: string;
  };
  taxonSelectInputThreshold: number;
  taxonAutocompleteInputThreshold: number;
  // taxonAutocompleteFields: [keyof Partial<Taxon>];
  taxonAutocompleteFields: NonNullable<(keyof Partial<Taxon>)[]>;
  program_list_sort: string;
  programsMasonryThreshold: number;
  OBSERVATIONS_FEATURES?: {
    TAXONOMY: {
      GROUP: string | CallbackFunctionVariadicAnyReturn;
    };
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CallbackFunctionVariadicAnyReturn = (...args: any[]) => any;

export interface APIPayload /* <T> */ {
  message: string;
  /*
  result: T | T[];
  status: boolean;
 */
}

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

export interface UserLogin extends User {
  username: string;
  password: string;
}

export interface UserRegistration extends UserLogin, Contact {
  username: string;
  password: string;
  name: string;
  surname: string;
  email: string;
}

export type RegisteringUser = Partial<UserRegistration>;

/* TODO: mv auth to feature module
  export abstract class AuthProvider {
    public abstract loggedIn: boolean;
    public abstract redirectUrl: string;
    public abstract login(): Promise<void>;
    public abstract logout(): void;
  } */

export interface Identification {
  refresh_token: string;
}

export interface AuthorizationPayload {
  access_token: string;
}

export interface RegistrationPayload
  extends APIPayload,
    User,
    Identification,
    AuthorizationPayload {
  message: string;
  username: string;
  refresh_token: string;
  access_token: string;
}

export type LoginPayload = Partial<RegistrationPayload>;

export interface LogoutPayload extends APIPayload {
  message: string;
}

export interface UserFeatures {
  id_role: number;
  username: string;
  stats: { [name: string]: string | number };
  admin: boolean;
}

export interface UserFeaturesPayload extends APIPayload, UserFeatures {
  message: string;
  features?: UserFeatures;
}

export interface JWT {
  header: {
    typ: string;
    alg: string;
  };
  payload: JWTPayload;
}

export interface JWTPayload {
  iat: number;
  nbf: number;
  jti: string;
  exp: number;
  identity: string;
  fresh: boolean;
  type: string;
}

export interface Badge {
  alt: string;
  img: string;
}

export interface RewardsApiPayload {
  badges: Badge[];
  rewards: string[];
}

export interface TaxonMedium {
  cd_nom: number;
  cd_ref: number;
  id_type: string;
  licence: string;
  source: string;
  thumb_url: string;
  titre: string;
  url: string;
}

export interface Taxon {
  cd_nom: number;
  cd_ref: number;
  cd_sup: number;
  classe: string;
  famille: string;
  group1_inpn: string;
  group2_inpn: string;
  id_habitat: number;
  id_rang: string;
  id_statut: string;
  lb_auteur: string;
  media: TaxonMedium[];
  nom_complet: string;
  nom_complet_html: SafeHtml;
  nom_valide: string;
  nom_vern: string;
  nom_vern_eng: string;
  ordre: string;
  phylum: string;
  regne: string;
}

export type Taxonomy = {
  [key in string | number]: Taxon;
};
