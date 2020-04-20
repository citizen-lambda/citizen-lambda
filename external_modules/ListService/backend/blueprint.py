import logging
from . import (  # noqa: F401
    logger,
    current_app,
    Blueprint,
    TAXA, Taxon, TaxonMedium, TaxonMedia
)

logger.setLevel(logging.DEBUG)
# logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)
# current_app.config['DEBUG'] = True

blueprint = Blueprint("lists", __name__)


@blueprint.route("/", methods=["GET"])
def default(*_args, **_kwargs):
    return {
        "test": f"booted {'ok' if TAXA is not None else 'not ok'}"
    }


@blueprint.route("/<int:list_id>", methods=["GET"])
def get(list_id: int, **_kwargs):
    return {
        "list_id": list_id,
        "test": f"booted {'ok' if TAXA is not None else 'not ok'}"
    }
