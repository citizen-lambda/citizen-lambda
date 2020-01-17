import { SafeHtml } from '@angular/platform-browser';

export interface IAppConfig {
  appName: string;
  API_ENDPOINT: string;
  // API_TAXHUB: "http://localhost:5000/api",
  URL_APPLICATION: string;
  FRONTEND: {
    PROD_MOD: boolean;
    // MULTILINGUAL: false,
    DISPLAY_FOOTER: boolean;
    DISPLAY_TOPBAR: boolean;
    DISPLAY_SIDEBAR: boolean;
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
    }
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
  taxonAutocompleteFields: string[];
  program_list_sort: string;
  OBSERVATIONS_FEATURES?: {
    TAXONOMY: {
      GROUP: Function;
    }
  };
}

type Partial<T> = {
  [P in keyof T]?: T[P];
};

// TODO: mv auth to feature module
// export abstract class AuthProvider {
//   public abstract loggedIn: boolean;
//   public abstract redirectUrl: string;
//   public abstract login(): Promise<void>;
//   public abstract logout(): void;
// }

export interface RegisteredUser {
  username: string;
  password: string;
  email: string;
  name: string;
  surname: string;
}

export type RegisteringUser = Partial<RegisteredUser>;

export interface LoggingUser {
  username: string;
  password: string;
}

export interface LoggedUser {
  message: string;
  access_token: string;
  refresh_token: string;
  username: string;
  status: string;
}

export type LoginPayload = Partial<LoggedUser>;

export interface LogoutPayload {
  msg: string;
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

export interface TokenRefresh {
  access_token: string;
}

export interface UserInfo {
  message: string;
  features?: any;
}

// export class APIPayload<T> {
//   message: string;
//   result: T | T[];
//   status: boolean;
// }

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

export interface Taxonomy {
  [key: string]: Taxon;
}

export interface ObservationData {
  id_observation: number;
  cd_nom: number;
  images?: string;
  image?: string;
  media?: any;
  comment?: string;
  observer?: {
    username: string;
  };
  municipality?: {
    name?: string;
    code?: string;
  };
  date: Date;
  count: Number;
}
