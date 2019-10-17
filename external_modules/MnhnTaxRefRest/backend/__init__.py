import requests
from dataclasses import fields
import json
from functools import lru_cache
from typing import (Optional, Sequence, List, Dict,
                    Mapping, Callable, Union)
from warnings import warn
from flask import current_app

from gncitizen.utils import (
    pick_str, parsed_url, pick_url, mapper,
    ReadRepoAdapter, V)
from gncitizen.core.taxonomy import (
    TAXA_READ_REPO_ADAPTERS,
    read_repo_factory,
    setup_default_repo)
from gncitizen.core.taxonomy.taxon import Taxon, TaxonMedium

from . import models  # noqa: F401


module_name = '.'.join(__name__.split('.')[:-1])
logger = current_app.logger
logger.info(f":{module_name} loading")


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
            ]
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
                ["title", ],
                ["licence", ],
                ["copyright", ],
                ["mimeType", ],
                ["_links", "thumbnailFile", "href"],
            ])
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
            pick_url(nodes, data)
            if nodes[0] == "_links" and nodes[-1] == "href"
            else pick_str(nodes, data)
        )
    return _extract


class MnhnTaxRefRestAdapter(MnhnTaxRefRest, ReadRepoAdapter[Taxon]):
    name = "TaxRef"

    @lru_cache(maxsize=MnhnTaxRefRest.CACHE_ITEMS)
    # type: ignore
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
                # if medium["taxon"]["referenceId"] == ref
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


TAXA_READ_REPO_ADAPTERS.register(MnhnTaxRefRestAdapter)
read_repo_adapter = read_repo_factory(MnhnTaxRefRestAdapter)
setup_default_repo(read_repo_adapter)
