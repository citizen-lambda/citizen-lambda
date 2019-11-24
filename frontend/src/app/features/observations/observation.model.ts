import { Feature, FeatureCollection } from 'geojson';

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


