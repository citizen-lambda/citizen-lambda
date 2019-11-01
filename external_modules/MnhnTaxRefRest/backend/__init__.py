import requests
from dataclasses import fields
import json
from functools import lru_cache
from typing import Optional, Sequence, List, Dict, Mapping, Callable, Union, overload
from warnings import warn
from flask import current_app

from gncitizen.utils import path_str, parsed_url, path_url, mapper, ReadRepoAdapter, V
from gncitizen.core.taxonomy import TAXA_READ_REPO_ADAPTERS, setup_default_repo
from gncitizen.core.taxonomy.taxon import Taxon, TaxonMedium

from . import models  # noqa: F401


module_name = ".".join(__name__.split(".")[:-1])
logger = current_app.logger
logger.info(f":{module_name} loading 🌠")


class MnhnTaxRefRest:
    BASE_URL = "https://taxref.mnhn.fr"
    API_URL = f"{BASE_URL}/api"
    TAXA_URL = f"{API_URL}/taxa"
    CACHE_ITEMS = 128
    TAXON_ATTR = {
        k: v
        for k, v in zip(
            fields(Taxon),
            [
                ["id"],
                ["referenceId"],
                ["parentId"],
                ["scientificName"],
                ["authority"],
                # ["fullName"],
                # ["fullNameHtml"],
                ["rankId"],
                # ["rankName"],  # id_rank = ES -> Espèces
                ["referenceName"],
                ["referenceNameHtml"],
                ["frenchVernacularName"],
                ["englishVernacularName"],
                # ["genusName"]
                ["familyName"],
                ["orderName"],
                ["className"],
                ["phylumName"],
                ["kingdomName"],
                ["vernacularGroup1"],
                ["vernacularGroup2"],
                ["habitat"],
                ["fr"],
                ["media"],
            ],
        )
    }

    MEDIA_ATTR = {
        k: v
        for k, v in zip(
            fields(TaxonMedium),
            [
                ["taxon", "id"],
                ["taxon", "referenceId"],
                ["_links", "file", "href"],
                ["title"],
                ["licence"],
                ["copyright"],
                ["mimeType"],
                ["_links", "thumbnailFile", "href"],
            ],
        )
    }
    RANK_NAMES = {
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
        if k == "rankName" and v in MnhnTaxRefRest.RANK_NAMES:
            return MnhnTaxRefRest.RANK_NAMES[v]
        # print(f"k:{k} v:{v}")
        return v

    return _dummy_transform


def extractor(data: Mapping) -> Callable:
    def _extract(nodes: Sequence[str]) -> str:
        return (
            path_url(nodes, data)
            if nodes[0] == "_links" and nodes[-1] == "href"
            else path_str(nodes, data)
        )

    return _extract


class MnhnTaxRefRestAdapter(MnhnTaxRefRest, ReadRepoAdapter[Taxon]):
    name = module_name
    provides = "TaxRef"

    @lru_cache(maxsize=MnhnTaxRefRest.CACHE_ITEMS)
    def get(self, ref: int, fetch_media=True) -> Optional[Taxon]:
        # TODO: our own cache
        # def gen_f():
        #     memo = dict()
        #     def f(x):
        #         try:
        #             return memo[x]
        #         except KeyError:
        #             memo[x] = x + 3
        #     return f
        # f = gen_f()
        # f(123)
        data = self.get_info(ref)
        if data:
            media: List[TaxonMedium] = []
            href = path_url(["_links", "media", "href"], data)
            if not href and fetch_media:
                ref_taxon_id = data.get("referenceId")
                media = self.get_media(
                    ref_taxon_id, f"{super().TAXA_URL}/{ref_taxon_id}/media"
                )
            if href and fetch_media:
                media = self.get_media(ref, href)
            data.update({"media": media})
            r = Taxon(*mapper(transformer, extractor, self.TAXON_ATTR, data))
            r.media = [medium for medium in media]
            return r
        return None

    def get_info(self, ref: int) -> Optional[Dict]:
        logger.info(ref)
        # assert url == f"{super().TAXA_URL}/{ref}"
        return self.api_call(f"{super().TAXA_URL}/{ref}", None)

    def get_media(self, ref, link) -> List[TaxonMedium]:
        # assert link == f"{super().TAXA_URL}/{ref}/media"
        data: Mapping = self.api_call(link, dict())
        if data and "_embedded" in data and "media" in data["_embedded"]:
            media = data["_embedded"]["media"]
            return [
                TaxonMedium(*mapper(transformer, extractor, self.MEDIA_ATTR, medium))
                for medium in media
                # if medium["taxon"]["referenceId"] == ref
            ]
        return []

    # def resolve(self, prop: str, value: Any) -> Iterable[T]:
    #     ...

    @overload
    def api_call(self, link: str) -> Optional[Dict]:
        ...

    @overload  # noqa: F811
    def api_call(self, link: str, defaultvalue: V) -> Union[Dict, V]:
        ...

    def api_call(  # noqa: F811
        self, link: str, defaultvalue: Optional[V] = None
    ) -> Union[Dict, V]:
        url = parsed_url(link)
        r = requests.get(url)
        try:
            r.raise_for_status()
            return r.json()
        except (
            requests.exceptions.HTTPError,
            json.decoder.JSONDecodeError,
            ValueError,
        ) as e:
            warn(str(e))
            return defaultvalue


TAXA_READ_REPO_ADAPTERS.register(MnhnTaxRefRestAdapter)
setup_default_repo()


# get taxref archive at:
# https://inpn.mnhn.fr/telechargement/referentielEspece/taxref/12.0/menu#
# python3  -mpip install --user csvs-to-sqlite
# sudo apt install sqlite
# csvs-to-sqlite TAXREFv12.txt taxref.db -s $'\t'
# sqlite3 taxref.db "SELECT * FROM TAXREFv12 WHERE ordre LIKE 'ODONATA' limit 10;"

# alternative: foreign-data-wrapper for PgSQL
# -- fdw_taxref_v12.sql
# CREATE EXTENSION file_fdw;
# CREATE SERVER taxref FOREIGN DATA WRAPPER file_fdw;
# CREATE SCHEMA mnhn;
# CREATE FOREIGN TABLE mnhn.TAXREFv12 (
# regne character varying, phylum character varying, classe character varying,
# ordre character varying, famille character varying, sous_famille character varying,
# tribu character varying, group1_inpn character varying, group2_inpn character varying,
# cd_nom character varying, cd_taxsup character varying, cd_sup character varying,
# cd_ref character varying, rang character varying, lb_nom character varying,
# lb_auteur character varying, nom_complet character varying,
# nom_complet_html character varying, nom_valide character varying,
# nom_vern character varying, nom_vern_eng character varying, habitat character varying,
# fr character varying, gf character varying, mar character varying,
# gua character varying, sm character varying, sb character varying,
# spm character varying, may character varying, epa character varying,
# reu character varying, sa character varying, ta character varying,
# taaf character varying, pf character varying, nc character varying,
# wf character varying, cli character varying, url character varying
# ) SERVER inpn OPTIONS (
# format 'csv', header 'true', filename '/tmp/TAXREFv12.txt', delimiter E'\t', null ''
# );

# SELECT * FROM mnhn.taxrefv12 WHERE ordre ILIKE 'ODONATA' limit 10;
