# coding:utf-8
import logging
import json
import urllib.parse
from flask import Blueprint, request, current_app, stream_with_context
from flask_jwt_extended import jwt_optional, get_jwt_identity  # , jwt_required
from flask_admin.form import SecureForm
from flask_admin.contrib.sqla import ModelView
from geojson import FeatureCollection
from gncitizen.utils.env import db, admin
from gncitizen.core.commons.models import (
    ModulesModel,
    ProgramsModel,
    FrontendBroadcastHandler,
)
from gncitizen.core.users.models import UserModel


try:
    from flask import _app_ctx_stack as ctx_stack  # type: ignore
except ImportError:  # pragma: no cover
    from flask import _request_ctx_stack as ctx_stack  # type: ignore
from flask_jwt_extended.utils import (
    decode_token,
    has_user_loader,
    user_loader,
    verify_token_not_blacklisted,
)
from flask_jwt_extended.exceptions import UserLoadError

logger = current_app.logger

routes = Blueprint("commons", __name__)


class ProgramView(ModelView):
    form_base_class = SecureForm

    def is_accessible(self):
        try:

            token = request.args.get("jwt")
            if not token:
                token = urllib.parse.parse_qsl(request.args.get("url"))[0][1]
            decoded_token = decode_token(token)
            verify_token_not_blacklisted(decoded_token, request_type="access")
            ctx_stack.top.jwt = decoded_token
            if has_user_loader():
                user = user_loader(ctx_stack.top.jwt["identity"])
                if user is None:
                    raise UserLoadError("user_loader returned None for {}".format(user))
                ctx_stack.top.jwt_user = user

            current_user = get_jwt_identity()
            is_admin = UserModel.query.filter_by(username=current_user).one().admin
            return current_user and is_admin
        except Exception as e:
            current_app.logger.critical("FAULTY ADMIN UI ACCESS: %s", str(e))
            return False


# response.headers['Content-Security-Policy'] = "frame-ancestors 'self' '\*.somesite.com' current_app.config['URL_APPLICATION']"  # noqa: E501
# response.headers['X-Frame-Options'] = 'SAMEORIGIN' # ALLOW-FROM
admin.add_view(ProgramView(ProgramsModel, db.session))


@routes.route("/modules/<int:pk>", methods=["GET"])
def get_module(pk):
    """Get a module by id
        ---
        tags:
            - Modules
        parameters:
            - name: pk
              in: path
              type: integer
              required: true
              example: 1
        responses:
            200:
                description: A module description
    """
    try:
        data = ModulesModel.query.filter_by(id_module=pk).first()
        return data.as_dict(), 200
    except Exception as e:
        return {"message": str(e)}, 400


@routes.route("/modules", methods=["GET"])
def get_modules():
    """Get all modules
        ---
        tags:
            - Modules
        responses:
            200:
                description: A list of all programs
    """
    try:
        modules = ModulesModel.query.all()
        count = len(modules)
        data = []
        for m in modules:
            d = m.as_dict()
            data.append(d)
        return {"count": count, "datas": data}, 200
    except Exception as e:
        return {"message": str(e)}, 400


@routes.route("/programs/<int:pk>", methods=["GET"])
def get_program(pk):
    """Get an observation by id
        ---
        tags:
            - Programs
        parameters:
            - name: pk
              in: path
              type: integer
              required: true
              example: 1
        responses:
            200:
                description: A list of all programs
        """
    try:
        data = ProgramsModel.query.filter_by(id_program=pk, is_active=True).limit(1)
        features = []
        for datum in data:
            feature = datum.get_geofeature()
            # for k, v in datum:
            #     feature['properties'][k] = v
            features.append(feature)
        return {"features": features}, 200
    except Exception as e:
        return {"message": str(e)}, 400


@routes.route("/programs", methods=["GET"])
def get_programs():
    """Get all programs
        ---
        tags:
            - Programs
        parameters:
            - name: with_geom
              in: query
              type: boolean
              description: geom desired (true) or not (false, default)
        responses:
            200:
                description: A list of all programs
    """
    try:
        # get with_geom argument from url (?with_geom=true)
        arg_with_geom = request.args.get("with_geom")
        if arg_with_geom:
            with_geom = json.loads(arg_with_geom.lower())
        else:
            with_geom = False
        programs = ProgramsModel.query.filter_by(is_active=True).all()
        count = len(programs)
        features = []
        for program in programs:
            if with_geom:
                feature = program.get_geofeature()
            else:
                feature = dict()
            feature["properties"] = program.as_dict(True)
            features.append(feature)
        feature_collection = FeatureCollection(features)
        feature_collection["count"] = count
        return feature_collection
    except Exception as e:
        logger.critical("[get_programs] Error: %s", str(e))
        return {"message": str(e)}, 400


frontend_handler = FrontendBroadcastHandler()
frontend_broadcast = logging.getLogger("stream")
frontend_broadcast.setLevel(logging.DEBUG)
frontend_broadcast.addHandler(frontend_handler)


@jwt_optional
@routes.route("/programs/stream")
def program_stream():
    # add get param … `since datetime` for (offline) reconnection
    # and handle the (todo) event log accordingly
    return current_app.response_class(
        stream_with_context(frontend_handler.subscribe()), mimetype="text/event-stream",
    )


@routes.route("/csp_report", methods=["POST"])
def csp_report():
    with open(current_app.config["CSP_REPORT_LOG"], "a") as fh:
        fh.write(request.data.decode() + "\n")
    return {"message": "done"}, 200
