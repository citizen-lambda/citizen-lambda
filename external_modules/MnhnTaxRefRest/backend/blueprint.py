import logging
from flask import (
    Blueprint,
    # request,
    # current_app,
    # jsonify,
    # send_from_directory
)

from . import logger, Taxon
from gncitizen.core.taxonomy import TAXA, TAXA_READ_REPO_ADAPTERS


logger.setLevel(logging.DEBUG)
# logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)
# current_app.config['DEBUG'] = True

blueprint = Blueprint('taxref', __name__)


@blueprint.route('/<int:taxon_id>', methods=['GET'])
def default(taxon_id: int, **kwargs):
    taxon: Taxon = TAXA.get(taxon_id)
    return {
        "adapters": [
            str(item.__name__)
            for item in TAXA_READ_REPO_ADAPTERS.get()
        ],
        "test": f"{taxon.cd_nom} {taxon.nom_valide} {taxon.nom_vern}"
    }
