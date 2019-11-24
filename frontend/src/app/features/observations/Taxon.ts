import { SafeHtml } from '@angular/platform-browser';
import { TaxonMedium } from './TaxonMedium';
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
