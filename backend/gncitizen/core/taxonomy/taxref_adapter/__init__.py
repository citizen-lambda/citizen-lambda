#!/usr/bin/env python3
from warnings import warn
from typing import (Optional, Sequence, List, Dict, Mapping, Callable, Union)
from functools import lru_cache
import json
import requests

from gncitizen.core.taxonomy.taxon import Taxon, TaxonMedium
from gncitizen.utils import (V, pick_str, parsed_url, pick_url, mapper)


class MnhnTaxRefRest:
    BASE_URL = "https://taxref.mnhn.fr"
    API_URL = f"{BASE_URL}/api"
    TAXA_URL = f"{API_URL}/taxa"
    CACHE_ITEMS = 128
    TAXON_ATTR = {
        "cd_nom": ["id"],
        "cd_ref": ["referenceId"],
        "cd_sup": ["parentId"],
        "nom_valide": ["scientificName"],
        "lb_auteur": ["authority"],
        # "nom_complet": ["fullName"],
        # "nom_complet_html": ["fullNameHtml"],
        "id_rang": ["rankId"],
        # _: ["rankName"],  # id_rank = ES -> Espèces
        "nom_complet": ["referenceName"],
        "nom_complet_html": ["referenceNameHtml"],
        "nom_vern": ["frenchVernacularName"],
        "nom_vern_eng": ["englishVernacularName"],
        # ["genusName"],
        "famille": ["familyName"],
        "ordre": ["orderName"],
        "classe": ["className"],
        "phylum": ["phylumName"],
        "regne": ["kingdomName"],
        # ["vernacularGenusName"],
        # ["vernacularFamilyName"],
        # ["vernacularOrderName"],
        # ["vernacularClassName"],
        # ["vernacularPhylumName"],
        # ["vernacularKingdomName"],
        "group1_inpn": ["vernacularGroup1"],
        "group2_inpn": ["vernacularGroup2"],
        "id_habitat": ["habitat"],
        "id_statut": ["fr"],
        # ["gf"],
        # ["mar"],
        # ["gua"],
        # ["sm"],
        # ["sb"],
        # ["spm"],
        # ["may"],
        # ["epa"],
        # ["reu"],
        # ["sa"],
        # ["ta"],
        # ["nc"],
        # ["wf"],
        # ["pf"],
        # ["cli"],
        # ["taxrefVersion"],
        "media": ["media"],
    }
    MEDIA_ATTR = {
        "cd_ref": ["taxon", "referenceId"],
        "url": ["_links", "file", "href"],
        "titre": ["title", ],
        "licence": ["licence", ],
        "source": ["copyright", ],
        "id_type": ["mimeType", ],
        "thumb_url": ["_links", "thumbnailFile", "href"],
    }


rank_names = {
    "AB": "Abberation",
    "AGES": "Agrégat",
    "CAR": "Cultivar",
    "CL": "Classe",
    "CLAD": "Cladus",
    "CLO": "Clône",
    "COH": "Cohorte",
    "CVAR": "Convariété",
    "Dumm": "Domaine",
    "DV": "Division",
    "ES": "Espèce",
    "FM": "Famille",
    "FO": "Forme",
    "FOES": "Forma species",
    "GN": "Genre",
    "HYB": "Hybride",
    "IFCL": "Infra-classe",
    "IFOR": "Infra-Ordre",
    "IFPH": "Infra-Phylum",
    "IFRG": "Infra-Règne",
    "KD": "Règne",
    "LEG": "Legio",
    "LIN": "Linea",
    "MES": "Micro-Espèce",
    "MO": "Morpha",
    "NAT": "Natio",
    "OR": "Ordre",
    "PH": "Embranchement",
    "PVCL": "Parv-Classe",
    "PVOR": "?",
    "RACE": "Race",
    "SBCL": "Sous-Classe",
    "SBDV": "Sous-division",
    "SBFM": "Sous-Famille",
    "SBOR": "Sous-Ordre",
    "SBPH": "Sous-Phylum",
    "SBSC": "Sous-Section",
    "SC": "Section",
    "SCO": "?",
    "SER": "Série",
    "SMES": "Semi-espèce",
    "SPCL": "Super-Classe",
    "SPFM": "Super-Famille",
    "SPOR": "Super-Ordre",
    "SPRG": "Super-Règne",
    "SPTR": "Supra-Tribu",
    "SSCO": "?",
    "SSER": "Sous-Série",
    "SSES": "Sous-espèce",
    "SSFO": "Sous-Forme",
    "SSGN": "Sous-Genre",
    "SSRG": "Sous-Règne",
    "SSTR": "Sous-Tribu",
    "SVAR": "Sous-Variété",
    "TR": "Tribu",
    "VAR": "Variété",
}


def transformer(k: str) -> Callable:
    def _dummy_transform(v: str) -> str:
        if k == "rankName" and v in rank_names:
            return rank_names[v]
        # print(f"k:{k} v:{v}")
        return v
    return _dummy_transform


def extractor(data: Mapping) -> Callable:
    def _extract(nodes: Sequence[str]) -> str:
        return (
            pick_url(nodes, data)
            if nodes[0] == "_links" and nodes[-1] == "href"
            else pick_str(nodes, data)
        )
    return _extract


class MnhnTaxRefRestAdapter(MnhnTaxRefRest):
    @lru_cache(maxsize=MnhnTaxRefRest.CACHE_ITEMS)
    def get(self, ref: int, fetch_media=True) -> Optional[Taxon]:
        data = self.get_info(ref)
        if data:
            media: List[TaxonMedium] = []
            href = pick_url(["_links", "media", "href"], data)
            if href and fetch_media:
                media = self.get_media(ref, href)
            data.update({"media": media})
            return Taxon(*mapper(transformer, extractor, self.TAXON_ATTR, data))  # noqa: E501
        return None

    def get_info(self, ref: int) -> Optional[Dict]:
        # assert url == f"{super().TAXA_URL}/{ref}"
        return self.api_call(f"{super().TAXA_URL}/{ref}", None)

    def get_media(self, ref, link) -> List[TaxonMedium]:
        # assert link == f"{super().TAXA_URL}/{ref}/media"
        data: Mapping = self.api_call(link, dict())
        if data and "_embedded" in data and "media" in data["_embedded"]:
            media = data["_embedded"]["media"]
            return [
                TaxonMedium(*mapper(transformer, extractor,
                                    self.MEDIA_ATTR, medium))
                for medium in media
                if medium["taxon"]["referenceId"] == ref
            ]
        return []

    # def resolve(self, prop: str, value: Any) -> Iterable[T]:
    #     ...

    def api_call(self, link: str, defaultvalue: V) -> Union[Dict, V]:
        url = parsed_url(link)
        r = requests.get(url)
        try:
            r.raise_for_status()
            return r.json()
        except (
            requests.exceptions.HTTPError,
            json.decoder.JSONDecodeError,
            ValueError
        ) as e:
            warn(str(e))
            return defaultvalue


if __name__ == "__main__":

    from timeit import timeit

    adapter = MnhnTaxRefRestAdapter()

    def show_results(result):
        "Print microseconds per pass."
        global count
        per_pass = 1000000 * (result / count)
        print('{:6.2f} µsec/pass'.format(per_pass), end=' ')

    for count in [1, 10]:
        show_results(timeit(
            stmt="adapter.get(61153)", setup="from __main__ import adapter", number=count))  # noqa: E501

    print(adapter.get(61153))
