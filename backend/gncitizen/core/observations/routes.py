# coding: utf-8
from typing import Union, Tuple, Dict
import logging
import uuid
import dataclasses
from flask import Blueprint, current_app, request, json, send_from_directory
from flask_jwt_extended import jwt_optional
from geojson import FeatureCollection
from geoalchemy2.shape import from_shape
from shapely.geometry import Point, asShape
from gncitizen.core.commons.models import (
    MediaModel,
    ProgramsModel,
    FrontendBroadcastHandler,
)
from gncitizen.core.ref_geo.models import LAreas
from gncitizen.core.observations.models import (
    ObservationMediaModel,
    ObservationModel,
)
from gncitizen.core.users.models import UserModel

from gncitizen.utils.env import MEDIA_DIR
from gncitizen.utils.errors import GeonatureApiError
from gncitizen.utils.jwt import get_id_role_if_exists
from gncitizen.utils.geo import get_municipality_id_from_wkb
from gncitizen.utils.media import save_upload_files
from gncitizen.utils.sqlalchemy import get_geojson_feature
from gncitizen.utils.env import db


logger = current_app.logger

frontend_handler = FrontendBroadcastHandler()
frontend_broadcast = logging.getLogger("stream")
frontend_broadcast.setLevel(logging.DEBUG)
frontend_broadcast.addHandler(frontend_handler)

routes = Blueprint("observations", __name__)

obs_keys = (
    "cd_nom",
    "id_observation",
    "observer",
    "municipality",
    "obs_txt",
    "count",
    "date",
    "comment",
    "timestamp_create",
)


def generate_observation_geojson(id_observation):
    """generate observation in geojson format from observation id

        :param id_observation: Observation unique id
        :type id_observation: int

        :return features: Observations as a Feature dict
        :rtype features: dict
    """
    observation = (
        db.session.query(
            ObservationModel,
            UserModel.username,
            LAreas.area_name,
            LAreas.area_code,
        )
        .join(
            UserModel,
            ObservationModel.id_role  # pylint: disable=comparison-with-callable
            == UserModel.id_user,
            full=True,
        )
        .join(
            LAreas,
            LAreas.id_area == ObservationModel.municipality,
            isouter=True,
        )
        .filter(ObservationModel.id_observation == id_observation)
    ).one()

    result_dict = observation.ObservationModel.as_dict(True)
    result_dict["observer"] = {"username": observation.username}
    result_dict["municipality"] = {
        "name": observation.area_name,
        "code": observation.area_code,
    }

    # Populate "geometry"
    features = []
    feature = get_geojson_feature(observation.ObservationModel.geom)

    # Populate "properties"
    for k in result_dict:
        if k in obs_keys:
            feature["properties"][k] = result_dict[k]

    from gncitizen.core.taxonomy import (  # pylint: disable=import-outside-toplevel
        TAXA,
    )

    feature["properties"]["media"] = [
        dataclasses.asdict(medium)
        for medium in TAXA.get(feature["properties"]["cd_nom"]).media
    ]

    features.append(feature)
    return features


@routes.route("/observations", methods=["POST"])
@jwt_optional
def post_observation():
    """Post a observation
    add a observation to database
        ---
        tags:
            - observations
        # security:
        #   - bearerAuth: []
        summary: Creates a new observation (JWT auth optional, if used, obs_txt replaced by username)
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
                            description: User name
                            required: false
                            example: Martin Dupont
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
        logger.debug("[post_observation] request data:", request_data)

        dat2rec = {}
        for field in request_data:
            if hasattr(ObservationModel, field):
                dat2rec[field] = request_data[field]
        logger.debug("[post_observation] dat2rec: %s", dat2rec)

        try:
            newobs = ObservationModel(**dat2rec)
        except Exception as e:
            logger.debug("[post_observation] data2rec ", e)
            raise GeonatureApiError(e)

        try:
            _coord = json.loads(request_data["geometry"])
            _point = Point(_coord["x"], _coord["y"])
            _shape = asShape(_point)
            newobs.geom = from_shape(Point(_shape), srid=4326)
        except Exception as e:
            logger.debug("[post_observation] coords ", e)
            raise GeonatureApiError(e)

        id_role = get_id_role_if_exists()
        if id_role:
            newobs.id_role = id_role
        else:
            if newobs.obs_txt is None or len(newobs.obs_txt) == 0:
                newobs.obs_txt = "Anonyme"

        newobs.uuid_sinp = uuid.uuid4()

        newobs.municipality = get_municipality_id_from_wkb(newobs.geom)
        db.session.add(newobs)
        db.session.commit()
        logger.debug(newobs.as_dict())
        features = generate_observation_geojson(newobs.id_observation)
        logger.debug("FEATURES: {}".format(features))
        try:
            file = save_upload_files(
                request.files,
                "obstax",
                newobs.cd_nom,
                newobs.id_observation,
                ObservationMediaModel,
            )
            logger.debug("ObsTax UPLOAD FILE {}".format(file))
            features[0]["properties"]["images"] = file

            json_data = json.dumps(
                {
                    "type": "update",
                    "data": {
                        "program": newobs.id_program,
                        "NewObservation": features[0],
                    },
                }
            )
            frontend_broadcast.info("data:%s\n\n", json_data)

        except Exception as e:
            logger.debug("ObsTax ERROR ON FILE SAVING", str(e))
            # raise GeonatureApiError(e)
            logger.critical(str(e))

        return (
            {"message": "Nouvelle observation créée.", "features": features},
            200,
        )

    except Exception as e:
        logger.warning("[post_observation] Error: %s", str(e))
        return {"message": str(e)}, 400


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
        observations_sql = (
            db.session.query(
                ObservationModel,
                UserModel.username,
                MediaModel.filename.label("image"),
                LAreas.area_name,
                LAreas.area_code,
            )
            .filter(
                ObservationModel.id_program == program_id,
                ProgramsModel.is_active,
            )
            .join(
                LAreas,
                LAreas.id_area == ObservationModel.municipality,
                isouter=True,
            )
            .join(
                ProgramsModel,
                ProgramsModel.id_program == ObservationModel.id_program,
                isouter=True,
            )
            .join(
                ObservationMediaModel,
                ObservationMediaModel.id_data_source
                == ObservationModel.id_observation,
                isouter=True,
            )
            .join(
                MediaModel,
                ObservationMediaModel.id_media == MediaModel.id_media,
                isouter=True,
            )
            .join(
                UserModel,
                ObservationModel.id_role  # pylint: disable=comparison-with-callable
                == UserModel.id_user,
                full=True,
            )
        )

        observations_sql = observations_sql.order_by(
            ObservationModel.date.desc()
        )
        # logger.debug(str(observations_sql))
        observations = observations_sql.all()

        features = []
        for observation in observations:
            feature = get_geojson_feature(observation.ObservationModel.geom)
            # Municipality
            feature["properties"]["municipality"] = {
                "name": observation.area_name,
                "code": observation.area_code,
            }

            # Observer
            feature["properties"]["observer"] = {
                "username": observation.username
            }

            # submitted medium
            feature["properties"]["image"] = (
                # FIXME: media route, now!
                "/".join(
                    [
                        current_app.config["API_ENDPOINT"],
                        current_app.config["MEDIA_FOLDER"],
                        observation.image,
                    ]
                )
                if observation.image
                else None
            )

            observation_dict = observation.ObservationModel.as_dict(True)
            for k in observation_dict:
                if k in obs_keys and k != "municipality":
                    feature["properties"][k] = observation_dict[k]

            features.append(feature)

        return FeatureCollection(features)

    except Exception as e:
        # if current_app.config["DEBUG"]:
        # import traceback
        # import sys

        # import pdb
        # pdb.set_trace()
        # etype, value, tb = sys.exc_info()
        # trace = str(traceback.print_exception(etype, value, tb))
        # trace = traceback.format_exc()
        # return("<pre>" + trace + "</pre>"), 500
        return {"message": str(e)}, 400
        # raise e


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
    logger.debug("rewards: %s", json.dumps(rewards, indent=4))
    return (
        {
            "badges": badges,
            "rewards": rewards,
            "REWARDS": current_app.config["REWARDS"],
        },
        200,
    )
