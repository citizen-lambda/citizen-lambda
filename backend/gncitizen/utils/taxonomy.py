#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""A module to manage taxonomy"""

from typing import Dict, List, Optional
from functools import lru_cache
from flask import current_app, json

from gncitizen.core.taxonomy import TAXA
from gncitizen.core.taxonomy.taxon import Taxon

if current_app.config.get("API_TAXHUB") is None:
    # from gncitizen.core.taxonomy.models import Taxref
    ...
else:
    # import requests

    TAXHUB_API = (
        """Yeah"""
        # current_app.config["API_TAXHUB"] + "/"
        # if current_app.config["API_TAXHUB"][-1] != "/"
        # else current_app.config["API_TAXHUB"]
    )

# Taxon = Dict[str, Union[str, Dict[str, str], List[Dict]]]


def taxhub_rest_get_taxon_list(taxhub_list_id: int) -> Dict:
    # payload = {"existing": "true", "order": "asc", "orderby": "taxref.nom_complet"}
    # res = requests.get(
    #     f"{TAXHUB_API}biblistes/taxons/{taxhub_list_id}", params=payload, timeout=1
    # )
    # res.raise_for_status()
    # return res.json()
    with open(
        "/home/pat/citizen/external_modules/ListService/config/24.json", "r"
    ) as f:
        return dict(**json.loads(f.read()))


def taxhub_rest_get_taxon(taxhub_id: int) -> Optional[Taxon]:
    # if not taxhub_id:
    #     raise ValueError("Null value for taxhub taxon id")
    # res = requests.get(f"{TAXHUB_API}bibnoms/{taxhub_id}", timeout=1)
    # res.raise_for_status()
    # return res.json()
    return TAXA.get(taxhub_id) if TAXA is not None else None


# @lru_cache()
def mkTaxonRepository(taxhub_list_id: int) -> List[Optional[Taxon]]:
    taxa = taxhub_rest_get_taxon_list(taxhub_list_id)
    taxon_ids = [item["id_nom"] for item in taxa.get("items", dict())]
    return [taxhub_rest_get_taxon(taxon_id) for taxon_id in taxon_ids]


def get_specie_from_cd_nom(cd_nom):
    """get specie datas from taxref id (cd_nom)

    :param cd_nom: taxref unique id (cd_nom)
    :type cd_nom: int

    :return: french and scientific official name (from ``cd_ref`` = ``cd_nom``) as dict
    :rtype: dict
    """

    # result = Taxref.query.filter_by(cd_nom=cd_nom).first()
    # official_taxa = Taxref.query.filter_by(cd_nom=result.cd_ref).first()

    # vernacular_names = official_taxa.nom_vern
    # vernacular_name = vernacular_names.split(",")[0]
    # vernacular_name_eng = official_taxa.get("nom_vern_eng")
    # sci_name = official_taxa.lb_nom
    # taxref = {}
    # taxref["vernacular_name"] = vernacular_name
    # taxref["vernacular_name_eng"] = vernacular_name_eng
    # taxref["sci_name"] = sci_name
    # for k in official_taxa:
    #     taxref[k] = official_taxa[k]
    # return taxref
    return TAXA.get(cd_nom)
