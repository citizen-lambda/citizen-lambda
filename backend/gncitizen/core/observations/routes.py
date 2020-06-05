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
    ObservationRecord4Program,
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
          - Observations
        # security:
        #   - bearerAuth: []
        summary: Creates a new observation (login is optional)
        consumes:
          - multipart/form-data
        produces:
          - application/json
        parameters:
          - name: id_program
            in: formData
            type: integer
            description: The program key.
            required: true
          - name: cd_nom
            in: formData
            description: The TaxRef taxon key.
            required: true
          - name: count
            in: formData
            description: Number of individuals.
            required: true
          - name: date
            in: formData
            description: The date of the observation.
            required: true
          - name: comment
            in: formData
            description: A comment relative to the photo or experience.
            required: true
            default: '""'
          - name: geometry
            in: formData
            description: Simple coordinates {"lng"&colon;5.415, "lat"&colon;43.285} or {"x"&colon; 5.4156, "y"&colon; 43.285}.
            exemple: {"lng":5.415, "lat":43.285}
            required: true
          - name: file
            in: formData
            description: The photo to upload.
            required: false
        responses:
          200:
            description: Added the observation
            schema:
              $ref: '#/definitions/Observation'

        definitions:
          Observation:
            allOf:
              - $ref: '#/definitions/Feature'
              - properties:
                  geometry:
                    $ref: '#/definitions/Point'
                  "properties":
                    type: object
                    properties:
                      cd_nom:
                        type: integer
                        description: Taxon key in the TaxRef repository
                      id_observation:
                        type: integer
                        description: Observation key in the repository
                      count:
                        type: integer
                        description: Number of individuals seen during the observation
                      date:
                        type: string
                        description: Date of observation
                        exemple: "2020-04-26"
                      image:
                        type: string
                        description: Photograph of the taxon submitted for observation,
                          failing this the support provided by the MNHN
                      comment:
                        type: string
                        description: A comment relative to the photo or experience.
                      municipality:
                        type: object
                        properties:
                          name:
                            type: string
                            description: Municipality name
                          code:
                            type: string
                            description: Municipality INSEE code
                      observer:
                        type: object
                        properties:
                          username:
                            type: string
                            description: Registered username or "Anonymous"
                      timestamp_create:
                        type: string
                        description: Observation creation date
                        exemple: "2020-04-26 14:42:00.763699"
          Observations:
            allOf:
              - $ref: '#/definitions/FeatureCollection'
              - type: object
              - properties:
                  features:
                    type: array
                    items:
                      $ref: '#/definitions/Observation'
          cd_nom:
            type: integer
            description: Taxon key in the TaxRef repository
          cd_ref:
            type: integer
            description: Key of the reference taxon in the TaxRef repository
          Geometry:
            type: object
            description: GeoJSon geometry
            discriminator: type
            required:
              - type
            externalDocs:
                url: http://geojson.org/geojson-spec.html#geometry-objects
            properties:
              type:
                type: string
                enum:
                - Point
                - Polygon
                - MultiPolygon
                description: the geometry type
          Point2D:
            type: array
            maxItems: 2
            minItems: 2
            items:
              type: number
          Point:
            type: object
            description: GeoJSon geometry
            externalDocs:
              url: http://geojson.org/geojson-spec.html#id2
            allOf:
              - $ref: "#/definitions/Geometry"
              - properties:
                  coordinates:
                    $ref: '#/definitions/Point2D'
          Polygon:
            type: object
            description: GeoJSon geometry
            externalDocs:
              url: http://geojson.org/geojson-spec.html#id4
            allOf:
              - $ref: "#/definitions/Geometry"
              - properties:
                  coordinates:
                    type: array
                    items:
                      type: array
                    items:
                      $ref: '#/definitions/Point2D'
          MultiPolygon:
            type: object
            description: GeoJSon geometry
            externalDocs:
              url: http://geojson.org/geojson-spec.html#id6
            allOf:
              - $ref: "#/definitions/Geometry"
              - properties:
                  coordinates:
                    type: array
                    items:
                      type: array
                      items:
                        type: array
                        items:
                          $ref: '#/definitions/Point2D'
          Feature:
            type: object
            description: GeoJSon Feature
            externalDocs:
              url: http://geojson.org/geojson-spec.html#feature-objects
            properties:
              type:
                type: string
                enum:
                - Feature
                description: The "Feature" type
              id:
                type: string
              geometry:
                $ref: '#/definitions/Geometry'
              "properties":
                type: object
          FeatureCollection:
            type: object
            description: GeoJSon FeatureCollection
            required:
              - type
              - geometries
            externalDocs:
              url: http://geojson.org/geojson-spec.html#feature-collection-objects
            properties:
              type:
                type: string
                enum:
                - FeatureCollection
              features:
                type: array
                items:
                  $ref: '#/definitions/Feature'
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
            logger.debug(coord)
            if "x" in coord and "y" in coord:
                point = Point(coord["x"], coord["y"])
            elif "lat" in coord and "lng" in coord:
                point = Point(coord["lng"], coord["lat"])
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

            event_stream_message = json.dumps(
                {
                    "type": "message",
                    "data": {"program": newobs.id_program, "NewObservation": feature},
                }
            )
            frontend_broadcast.info(event_stream_message)

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
    """ Returns all observations of a program
        ---
        tags:
          - Observations
        parameters:
          - name: id
            description: The program key
            in: path
            type: integer
            required: true
            example: 1
        responses:
          200:
            description: A list of all observations
            schema:
              $ref: '#/definitions/Observations'
        """
    try:
        records: List[ObservationRecord4Program] = observations4program(program_id)
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
