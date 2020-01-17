import { Feature, FeatureCollection } from 'geojson';
import { IAppConfig } from '../../core/models';
import { Program } from '../programs/programs.models';

export interface PostObservationResponse extends FeatureCollection {
  message: string;
  features: PostObservationResponsePayload[];
}

export type PostObservationResponsePayload = Feature & {
  properties: {
    cd_nom: number;
    comment: string;
    vernacular_name: string;
    count: number;
    date: Date;
    id_observation: number;
    images?: string[];
    municipality?: any;
    obs_txt: string;
    observer?: any;
    sci_name: string;
    timestamp_create: Date;
  };
};


export type ObsFeaturesConfig = Pick<IAppConfig, 'OBSERVATIONS_FEATURES'>;
export type AppConfigModalFlow = Pick<IAppConfig, 'appName' | 'SEO' | 'program_add_an_observation'>;

export interface ObsState {
  program: Program;
  observations: FeatureCollection;
  selected: Feature;
}
