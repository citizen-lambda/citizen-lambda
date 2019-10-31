#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""A module to manage taxonomy"""

from typing import Dict, List, Any
import dataclasses
from flask import current_app, json

logger = current_app.logger


def taxa_list(taxhub_list_id: int) -> Dict:
    # TODO: plugin ListService
    with open("/home/pat/citizen/external_modules/ListService/data/24.json", "r") as f:
        return dict(**json.loads(f.read()))


def mkTaxonRepository(taxalist_id: int) -> List[Dict[str, Any]]:
    from gncitizen.core.taxonomy import TAXA

    taxa = taxa_list(taxalist_id)
    taxon_ids = [item["cd_nom"] for item in taxa.get("items", dict())]
    return [dataclasses.asdict(TAXA.get(taxon_id)) for taxon_id in taxon_ids]


def get_specie_from_cd_nom(cd_nom):
    """get specie datas from taxref id (cd_nom)

    :param cd_nom: taxref unique id (cd_nom)
    :type cd_nom: int

    :return: french and scientific official name (from ``cd_ref`` = ``cd_nom``) as dict
    :rtype: dict
    """
    from gncitizen.core.taxonomy import TAXA

    return dataclasses.asdict(TAXA.get(cd_nom))
