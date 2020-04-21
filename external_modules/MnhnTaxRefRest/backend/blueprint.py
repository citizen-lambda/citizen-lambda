# import logging
import dataclasses
from flask import Blueprint

from gncitizen.core.taxonomy import TAXA, TAXA_READ_REPO_ADAPTERS
from gncitizen.core.taxonomy.taxon import Taxon


# logger.setLevel(logging.DEBUG)
# logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)
# current_app.config['DEBUG'] = True

blueprint = Blueprint("taxref", __name__)


@blueprint.route("/<int:taxon_id>", methods=["GET"])
def default(taxon_id: int, **_kwargs):
    taxon: Taxon = TAXA.get(taxon_id)
    print(type(taxon))
    return (
        dataclasses.asdict(taxon)
        if dataclasses.is_dataclass(taxon)
        else ({"message": f"Error fetching species data for {taxon_id}"}, 400)
    )


@blueprint.route("/config", methods=["GET"])
def configview(*_args, **_kwargs):
    return {"adapters": str(TAXA_READ_REPO_ADAPTERS.get())}
