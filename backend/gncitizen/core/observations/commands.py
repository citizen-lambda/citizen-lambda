# coding: utf-8
from typing import List, Optional, Union, cast
from geojson import Feature, FeatureCollection
from flask import current_app

from gncitizen.utils.env import db
from gncitizen.core.taxonomy.models import Taxref
from gncitizen.core.ref_geo.models import LAreas
from gncitizen.core.commons.models import MediaModel, ProgramsModel
from gncitizen.core.observations.models import (
    ObservationModel,
    ObservationMediaModel,
    obs_keys,
)
from gncitizen.core.users.models import UserModel
from gncitizen.utils.sqlalchemy import get_geojson_feature


class ObservationRecord4Program:
    ObservationModel: ObservationModel
    username: str = ""
    image: str
    area_name: str
    area_code: str


class ObservationRecord4AnonymousExport:
    ObservationModel: ObservationModel
    image: str
    area_name: str
    municipality_insee: str
    cd_nom: int
    nom_complet: str
    nom_vern: str


class ObservationRecord4UserExport(ObservationRecord4AnonymousExport):
    username: str


ObservationRecord4Export = Union[
    ObservationRecord4AnonymousExport, ObservationRecord4UserExport
]


def is_anonymous(username: str) -> bool:
    return username is not None and username.strip().lower() in {"anonymous", "anonyme"}


def observations4user(username: str,) -> List[ObservationRecord4Export]:
    user = None
    models = {
        ObservationModel,
        MediaModel.filename.label("image"),
        LAreas.area_name,
        LAreas.area_code.label("municipality_insee"),
        Taxref.cd_nom,
        Taxref.nom_complet,
        Taxref.nom_vern,
    }
    if not is_anonymous(username):
        user = UserModel.find_by_username(username=username.strip())
        models = {UserModel.username, *models}

    query = db.session.query(*models)
    if user:
        query = query.filter(ObservationModel.id_role == user.id_user).join(
            UserModel, ObservationModel.id_role == UserModel.id_user, full=True,
        )
    else:
        query = query.filter(ObservationModel.id_role.is_(None))
    query = (
        query.join(
            LAreas, LAreas.id_area == ObservationModel.municipality, isouter=True,
        )
        .join(
            ObservationMediaModel,
            ObservationMediaModel.id_data_source == ObservationModel.id_observation,
            isouter=True,
        )
        .join(
            MediaModel,
            ObservationMediaModel.id_media == MediaModel.id_media,
            isouter=True,
        )
        .join(Taxref, Taxref.cd_nom == ObservationModel.cd_nom, isouter=True,)
    ).order_by(ObservationModel.date.desc())
    return cast(List[ObservationRecord4Export], query.all())


def observations2features4export(
    records: List[ObservationRecord4Export],
) -> Optional[List[Feature]]:
    features: List[Feature] = []
    for record in records:
        feature: Feature = get_geojson_feature(record.ObservationModel.geom)
        feature["properties"].update(
            record.ObservationModel.as_dict(
                True, ("id_observation", "uuid_sinp", *obs_keys)
            )
        )
        feature["properties"]["nom_complet"] = record.nom_complet
        feature["properties"]["nom_vern"] = record.nom_vern
        feature["properties"]["municipality_name"] = record.area_name
        feature["properties"]["municipality_insee"] = record.municipality_insee
        feature["properties"]["observer"] = (
            record.__getattribute__("username") or "Anonymous"
        )
        feature["properties"]["image"] = (
            "/".join(
                [
                    current_app.config["API_ENDPOINT"],
                    current_app.config["MEDIA_FOLDER"],
                    record.image,
                ]
            )
            if record.image
            else ""
        )
        features.append(feature)
    return features


def export4user(username: str) -> FeatureCollection:
    records: List[ObservationRecord4Export] = observations4user(username)
    return FeatureCollection(observations2features4export(records))


def observations4program(program_id: int) -> List[ObservationRecord4Program]:
    query = (
        # pylint: disable=comparison-with-callable
        db.session.query(
            ObservationModel,
            UserModel.username,
            MediaModel.filename.label("image"),
            LAreas.area_name,
            LAreas.area_code,
        )
        .filter(ObservationModel.id_program == program_id, ProgramsModel.is_active,)
        .join(LAreas, LAreas.id_area == ObservationModel.municipality, isouter=True,)
        .join(
            ProgramsModel,
            ProgramsModel.id_program == ObservationModel.id_program,
            isouter=True,
        )
        .join(
            ObservationMediaModel,
            ObservationMediaModel.id_data_source == ObservationModel.id_observation,
            isouter=True,
        )
        .join(
            MediaModel,
            ObservationMediaModel.id_media == MediaModel.id_media,
            isouter=True,
        )
        .join(UserModel, ObservationModel.id_role == UserModel.id_user, full=True,)
    ).order_by(ObservationModel.date.desc())
    return cast(List[ObservationRecord4Program], query.all())


def observations2features4front(
    records: List[ObservationRecord4Program],
) -> Optional[List[Feature]]:
    features: List[Feature] = []
    for record in records:
        feature: Feature = get_geojson_feature(record.ObservationModel.geom)
        feature["properties"].update(record.ObservationModel.as_dict(True, obs_keys))
        feature["properties"]["municipality"] = {
            "name": record.area_name,
            "code": record.area_code,
        }
        feature["properties"]["observer"] = {"username": record.username}
        feature["properties"]["image"] = (
            "/".join(
                [
                    current_app.config["API_ENDPOINT"],
                    current_app.config["MEDIA_FOLDER"],
                    record.image,
                ]
            )
            if record.image
            else None
        )
        features.append(feature)
    return features
