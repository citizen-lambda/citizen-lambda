# import logging
import dataclasses
from flask import Blueprint

from . import (
    # logger,
    Taxon,
)
from gncitizen.core.taxonomy import TAXA, TAXA_READ_REPO_ADAPTERS


# logger.setLevel(logging.DEBUG)
# logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)
# current_app.config['DEBUG'] = True

blueprint = Blueprint("taxref", __name__)


@blueprint.route("/<int:taxon_id>", methods=["GET"])
def default(taxon_id: int, **kwargs):
    taxon: Taxon = TAXA.get(taxon_id)
    return dataclasses.asdict(taxon) if taxon else { "message": "Error fetching species data" }, 400


@blueprint.route("/config", methods=["GET"])
def configview(*args, **kwargs):
    return {"adapters": str(TAXA_READ_REPO_ADAPTERS.get())}
