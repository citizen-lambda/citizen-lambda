# coding: utf-8

"""A module to manage taxonomy"""

from typing import Dict, Optional, cast
import dataclasses
from flask import current_app, json
from gncitizen.core.taxonomy.taxon import Taxon
from gncitizen.utils import ReadRepository

logger = current_app.logger


def taxa_list(list_id: int) -> Dict:
    # TODO: plug in ListService
    try:
        with open(
            f"/home/pat/citizen/external_modules/ListService/data/{list_id}.json",
            "r",
        ) as f:
            return dict(**json.loads(f.read()))
    except FileNotFoundError:
        # TODO: ListService sensible default list
        with open(
            "/home/pat/citizen/external_modules/ListService/data/24.json", "r"
        ) as f:
            return dict(**json.loads(f.read()))


def mk_taxon_repository(taxalist_id: int) -> Dict[int, Optional[Taxon]]:
    from gncitizen.core.taxonomy import (  # pylint: disable=import-outside-toplevel
        TAXA,
    )

    if TAXA is not None:
        taxa = taxa_list(taxalist_id)
        taxon_ids = [item["cd_nom"] for item in taxa.get("items", dict())]
        try:
            return {
                taxon_id: TAXA.get(taxon_id)
                for taxon_id in taxon_ids
                if taxon_id
            }
        except Exception as e:
            logger.warning(str(e))
            return dict()
    else:
        raise Exception("No TAXA")


def get_specie_from_cd_nom(cd_nom) -> Optional[Dict]:
    # backend/gncitizen/core/observations/routes.py:get_observations:/observations
    """get specie datas from taxref id (cd_nom)#observations

    :param cd_nom: taxref unique id (cd_nom)
    :type cd_nom: int

    :return: french and scientific official name (from ``cd_ref`` = ``cd_nom``) as dict
    :rtype: dict
    """
    from gncitizen.core.taxonomy import (  # pylint: disable=import-outside-toplevel
        TAXA,
    )

    try:
        return dataclasses.asdict(
            cast(ReadRepository[Taxon], TAXA).get(cd_nom)
        )
    except Exception as e:
        logger.warning(str(e))
        return {"cd_nom": dict()}
