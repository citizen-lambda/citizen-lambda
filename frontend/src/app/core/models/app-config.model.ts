import { Taxon } from './taxonomy.model';

export interface AppConfigInterface {
  appName: string;
  API_ENDPOINT: string;
  URL_APPLICATION: string;
  FRONTEND: {
    PROD_MOD: boolean;
    DISPLAY_FOOTER: boolean;
  };
  IMAGE_EXTENSIONS: Set<string>;
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
  programsGridThreshold: number;
  OBSERVATIONS_FEATURES?: {
    TAXONOMY: {
      GROUP: string | CallbackFunctionVariadicAnyReturn;
    };
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CallbackFunctionVariadicAnyReturn = (...args: any[]) => any;
