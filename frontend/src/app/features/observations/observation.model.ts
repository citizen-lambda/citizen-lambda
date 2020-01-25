import { Feature, FeatureCollection } from 'geojson';
import { IAppConfig, Taxon, TaxonMedium } from '../../core/models';
import { Program } from '../programs/programs.models';

export interface ObservationData {
  id_observation: number;
  cd_nom: number;
  images?: string; // posted new obs
  image?: string; // posted obs
  media?: TaxonMedium[]; // TODO: fallback ? do we still use this field ? migrate && rm otherwise
  comment?: string;
  observer?: {
    username: string;
  };
  municipality?: {
    name: string;
    code: string;
  };
  date: Date;
  count: Number;
}

export type AnonymousObserver = Partial<{ username: 'Anonyme' }>;
export type Observer = Pick<ObservationData, 'observer'> | AnonymousObserver;
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

export interface ObsPostResponse extends FeatureCollection {
  message: string;
  features: ObsPostResponsePayload[];
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

export type ConfigObsFeatures = Pick<IAppConfig, 'OBSERVATIONS_FEATURES'>;
export type ConfigModalFlow = Pick<IAppConfig, 'appName' | 'SEO' | 'program_add_an_observation'>;

export interface ObsState {
  program: Program;
  observations: FeatureCollection;
  selected: Feature;
}
