from flask import Blueprint
from gncitizen.utils.taxonomy import mk_taxon_repository


routes = Blueprint("taxonomy", __name__)


@routes.route("/taxonomy/lists/<int:id_>/species", methods=["GET"])
def get_list(id_):
    return mk_taxon_repository(id_)
