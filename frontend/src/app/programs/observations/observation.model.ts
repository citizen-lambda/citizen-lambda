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

export interface TaxonomyItemMedia {
  cd_nom: number;
  cd_ref: number;
  id_type: string;
  licence: string;
  source: string;
  thumb_url: string;
  titre: string;
  url: string;
}
export interface TaxonomyListItem {
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
  media: TaxonomyItemMedia[];
  nom_complet: string;
  nom_complet_html: string;
  nom_valide: string;
  nom_vern: string;
  nom_vern_eng: string;
  ordre: string;
  phylum: string;
  regne: string;
}

export interface TaxonomyList {
  [index: number]: TaxonomyListItem;
}
