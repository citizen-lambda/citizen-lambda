# coding: utf-8
from typing import Dict, List, Tuple, Union, cast
import logging
import uuid
import dataclasses
from flask import (
    Blueprint,
    current_app,
    request,
    json,
    send_from_directory,
    make_response,
    Response,
)
from flask_jwt_extended import jwt_required, jwt_optional, get_jwt_identity
from geojson import FeatureCollection, Feature
from geoalchemy2.shape import from_shape
from shapely.geometry import Point, asShape

from gncitizen.core.commons.models import FrontendBroadcastHandler
from gncitizen.core.ref_geo.models import LAreas
from gncitizen.core.observations.models import (
    ObservationMediaModel,
    ObservationModel,
    obs_keys,
)
from gncitizen.core.observations.commands import (
    observations4program,
    observations2features4front,
    export4user,
)
from gncitizen.core.users.models import UserModel
from gncitizen.utils import ReadRepository
from gncitizen.utils.env import db, MEDIA_DIR
from gncitizen.utils.errors import GeonatureApiError
from gncitizen.utils.jwt import get_id_role_if_exists
from gncitizen.utils.geo import get_municipality_id_from_wkb
from gncitizen.utils.sqlalchemy import get_geojson_feature
from gncitizen.utils.media import save_uploaded_files
from gncitizen.utils.taxonomy import Taxon


logger = current_app.logger

frontend_handler = FrontendBroadcastHandler()
frontend_broadcast = logging.getLogger("stream")
frontend_broadcast.setLevel(logging.DEBUG)
frontend_broadcast.addHandler(frontend_handler)

routes = Blueprint("observations", __name__)


def generate_observation_geojson(id_observation: int) -> Feature:
    """ generate a geojson feature from an observation id """
    observation = (
        # pylint: disable=comparison-with-callable
        db.session.query(
            ObservationModel, UserModel.username, LAreas.area_name, LAreas.area_code,
        )
        .join(UserModel, ObservationModel.id_role == UserModel.id_user, full=True,)
        .join(LAreas, LAreas.id_area == ObservationModel.municipality, isouter=True,)
        .filter(ObservationModel.id_observation == id_observation)
    ).one()

    result: Dict = observation.ObservationModel.as_dict(True)
    result["observer"] = {"username": observation.username}
    result["municipality"] = {
        "name": observation.area_name,
        "code": observation.area_code,
    }

    # Populate "geometry"
    feature: Feature = get_geojson_feature(observation.ObservationModel.geom)

    # Populate "properties"
    for k in result:
        if k in obs_keys:
            feature["properties"][k] = result[k]

    from gncitizen.core.taxonomy import TAXA  # pylint: disable=import-outside-toplevel

    feature["properties"]["media"] = [
        dataclasses.asdict(medium)
        for medium in cast(
            Taxon,
            cast(ReadRepository[Taxon], TAXA).get(feature["properties"]["cd_nom"]),
        ).media
    ]

    return feature


@routes.route("/observations", methods=["POST"])
@jwt_optional
def post_observation() -> Tuple[Dict, int]:
    """ Add an observation to the database
        ---
        tags:
            - observations
        # security:
        #   - bearerAuth: []
        summary: Creates a new observation (login is optional)
        consumes:
            - application/json
            - multipart/form-data
        produces:
            - application/json
        parameters:
            - name: json
                in: body
                description: JSON parameters.
                required: true
                schema:
                    id: observation
                    required:
                        - cd_nom
                        - date
                        - geom
                    properties:
                        id_program:
                            type: string
                            description: Program unique id
                            example: 1
                            default: 1
                        cd_nom:
                            type: string
                            description: CD_Nom Taxref
                            example: 3582
                        obs_txt:
                            type: string
                            default:  none
                            description: comment
                            required: false
                            example: amazing xp
                        count:
                            type: integer
                            description: Number of individuals
                            default:  none
                            example: 1
                        date:
                            type: string
                            description: Date
                            required: false
                            example: "2018-09-20"
                        geometry:
                            type: string
                            description: Geometry (GeoJson format)
                            example: {"type":"Point", "coordinates":[5,45]}
        responses:
            200:
                description: Adding a observation
        """  # noqa: E501
    try:
        request_data = request.form
        data = dict()
        for k in request_data:
            if hasattr(ObservationModel, k):
                data[k] = request_data[k]
        logger.debug("[post_observation] data: %s", data)

        try:
            newobs = ObservationModel(**data)
        except Exception as e:
            logger.error("[post_observation] ObservationModel failure: %s", str(e))
            raise GeonatureApiError(e)

        try:
            coord = json.loads(request_data["geometry"])
            point = Point(coord["x"], coord["y"])
            shape = asShape(point)
            newobs.geom = from_shape(Point(shape), srid=4326)
        except Exception as e:
            logger.error("[post_observation] geometry extraction failure: %s", str(e))
            raise GeonatureApiError(e)

        id_role = get_id_role_if_exists()
        if id_role:
            newobs.id_role = id_role

        newobs.uuid_sinp = uuid.uuid4()
        newobs.municipality = get_municipality_id_from_wkb(newobs.geom)

        db.session.add(newobs)
        db.session.commit()

        feature = generate_observation_geojson(newobs.id_observation)
        try:
            files = save_uploaded_files(
                request.files,  # MultiDict of FileStorage
                "obstax",
                newobs.cd_nom,
                newobs.id_observation,
                ObservationMediaModel,
            )
            logger.debug("[post_observation] uploaded image files %s", str(files))
            feature["properties"]["images"] = files

            json_data = json.dumps(
                {
                    "type": "update",
                    "data": {"program": newobs.id_program, "NewObservation": feature},
                }
            )
            frontend_broadcast.info("data:%s\n\n", json_data)

            return (
                {"message": "Nouvelle observation créée.", "features": feature},
                200,
            )
        except Exception as e:
            logger.critical("[post_observation] image saving failure: %s", str(e))
            raise
    except Exception as e:
        logger.critical("[post_observation] Error: %s", str(e))
        return (
            {"message": "Une erreur est survenue: contactez l'administrateur."},
            500,
        )


@routes.route("/observations", methods=["GET"])
@jwt_required
def export_user_observations() -> Union[Response, Tuple[Dict, int]]:
    username = get_jwt_identity() or "Anonymous"
    try:
        if username:
            response: Response = make_response(
                json.dumps(export4user(username), indent=4)
            )
            response.headers["Content-Type"] = "text/json"
            response.headers[
                "Content-Disposition"
            ] = "attachment; filename=export.geojson"
            return response

        return (
            {"message": "Connectez vous pour obtenir vos données personnelles."},
            400,
        )
    except Exception as e:
        current_app.logger.critical(
            "[export user observations] `%s` export failure: %s", username, str(e),
        )
        return (
            {"message": "Une erreur est survenue: contactez l'administrateur."},
            500,
        )


@routes.route("/programs/<int:program_id>/observations", methods=["GET"])
def get_program_observations(
    program_id: int,
) -> Union[FeatureCollection, Tuple[Dict, int]]:
    """Get all observations from a program
        GET
            ---
            tags:
                - observations
            parameters:
                - name: id
                    in: path
                    type: integer
                    required: true
                    example: 1
            definitions:
                cd_nom:
                    type: integer
                    description: cd_nom taxref
                geometry:
                    type: dict
                    description: Géométrie de la donnée
                name:
                    type: string
                geom:
                    type: geometry
            responses:
                200:
                    description: A list of all species lists
        """
    try:
        records: List[Tuple] = observations4program(program_id)
        return FeatureCollection(observations2features4front(records))

    except Exception as e:
        current_app.logger.critical(
            "[program observations] failure: %s", str(e),
        )
        return (
            {"message": "Une erreur est survenue: contactez l'administrateur."},
            500,
        )


@routes.route("media/<item>")
def get_media(item):
    return send_from_directory(str(MEDIA_DIR), item)


@routes.route("/dev_rewards/<int:id_>")
def get_rewards(id_):
    from gncitizen.utils.rewards import (  # pylint: disable=import-outside-toplevel
        get_rewards,
        get_badges,
    )

    badges, rewards = get_badges(id_), get_rewards(id_)
    # logger.debug("rewards: %s", json.dumps(rewards, indent=4))
    return (
        {
            "badges": badges,
            "rewards": rewards,
            "REWARDS": current_app.config["REWARDS"],
        },
        200,
    )
