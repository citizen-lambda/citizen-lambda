from flask import Blueprint
from gncitizen.core.taxonomy import TAXA


blueprint = Blueprint("lists", __name__)


@blueprint.route("/", methods=["GET"])
def default(*_args, **_kwargs):
    return {"test": f"booted {'ok' if TAXA is not None else 'not ok'}"}


@blueprint.route("/<int:list_id>", methods=["GET"])
def get(list_id: int, **_kwargs):
    return {
        "list_id": list_id,
        "test": f"booted {'ok' if TAXA is not None else 'not ok'}",
    }
