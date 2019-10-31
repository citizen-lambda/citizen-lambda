#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""A module to manage taxonomy"""

from typing import Dict, List, Any
import dataclasses
from flask import current_app, json

logger = current_app.logger


def taxa_list(taxhub_list_id: int) -> Dict:
    # payload = {"existing": "true", "order": "asc", "orderby": "taxref.nom_complet"}
    # res = requests.get(
    #     f"{TAXHUB_API}biblistes/taxons/{taxhub_list_id}", params=payload, timeout=1
    # )
    # res.raise_for_status()
    # return res.json()
    with open("/home/pat/citizen/external_modules/ListService/data/24.json", "r") as f:
        return dict(**json.loads(f.read()))


# @lru_cache()
# def mkTaxonRepository(taxalist_id: int) -> List[Optional[Taxon]]:
def mkTaxonRepository(taxalist_id: int) -> List[Dict[str, Any]]:
    from gncitizen.core.taxonomy import TAXA

    taxa = taxa_list(taxalist_id)
    taxon_ids = [item["cd_nom"] for item in taxa.get("items", dict())]
    t = [dataclasses.asdict(TAXA.get(taxon_id)) for taxon_id in taxon_ids]
    logger.debug(f"tx: {t}")
    return t


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
    from gncitizen.core.taxonomy import TAXA

    return TAXA.get(cd_nom)
