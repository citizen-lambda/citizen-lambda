import { Feature, FeatureCollection } from 'geojson';

import { Taxon, TaxonMedium, Taxonomy } from '@models/taxonomy.model';
import { AppConfigInterface } from '@models/app-config.model';
import { AnonymousUser } from '@models/user.model';
import { APIPayload } from '@models/api.model';
import { Program } from '@models/programs.models';

export interface ObservationData {
  id_observation: number;
  cd_nom: number;
  images?: string; // posted new obs
  image?: string; // posted obs
  media?: TaxonMedium[];
  comment?: string;
  observer?: {
    username: string;
  };
  municipality?: {
    name: string;
  };
  date: Date;
  count: number;
}

// TODO: check new Anonymous(this.localeId) from models
export type Observer = Pick<ObservationData, 'observer'> | AnonymousUser;
export interface Municipality {
  name: string;
  code: string;
}
export type Count = Pick<ObservationData, 'count'>;
export type ObsDate = Pick<ObservationData, 'date'>;
export type ObsSummary = Pick<
  ObservationData,
  'id_observation' | 'cd_nom' | 'image' | 'images' | 'media'
> &
  Taxon &
  Count &
  ObsDate &
  Municipality &
  Observer;
export type ObsDetails = Pick<ObservationData, 'comment'> & ObsSummary;

export interface ObsPostResponse extends APIPayload {
  message: string;
  features: ObsPostResponsePayload;
}

// TODO: migrate component to taxo service/obs facade
export type ObsPostResponsePayload = Feature & {
  properties: ObsDetails & {
    images?: string[];
    obs_txt: string;
    sci_name: string;
    vernacular_name: string;
    timestamp_create: Date;
  };
};

export type ConfigObsFeatures = Pick<AppConfigInterface, 'OBSERVATIONS_FEATURES'>;
export type ConfigModalFlow = Pick<
  AppConfigInterface,
  'appName' | 'SEO' | 'program_add_an_observation'
>;

export interface ObsState {
  program: Program;
  observations: FeatureCollection;
  selected: Feature;
}

export interface SharedContext {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [name: string]: any;
  coords?: L.LatLng | undefined;
  program?: FeatureCollection;
  taxa?: Taxonomy;
}
