import click
from flask.cli import with_appcontext
from flask import current_app, json

from gncitizen.utils.env import db
from gncitizen.core.taxonomy.models import Taxref  # , TMedias
from gncitizen.core.ref_geo.models import LAreas
from gncitizen.core.commons.models import MediaModel, ProgramsModel
from gncitizen.core.observations.models import (
    ObservationModel,
    ObservationMediaModel,
    obs_keys,
)
from gncitizen.core.users.models import UserModel


# export FLASK_ENV=develop; export FLASK_DEBUG=1; export FLASK_APP=wsgi; python3 -m flask shell  # noqa: E501

# wanna save 40% on image disk space ?
# sudo apt install jpegoptim optipng advancecomp pngcrush
# find . -iname "*.jpg" -print0 | \
#   xargs -0 --max-procs=4 --max-args 1 jpegoptim --max=70
#
# ⚠ this is way too slow
# find . -iname "*.png" -print0 | \
#   xargs -0 --max-procs=4 --max-args 1 -I {} sh -c \
#       "optipng -force -o7 \"{}\" && \
#       advpng -z4 \"{}\" && \
#       pngcrush -rem gAMA -rem alla \
#                -rem cHRM -rem iCCP -rem sRGB \
#                -rem time \"{}\" \"{}\".bak && mv -f \"{}\".bak \"{}\""


def register(app):
    @app.cli.group()
    def dbmanage():
        pass

    @dbmanage.command("create_all")
    @with_appcontext
    def db_create_all():  # pylint: disable=unused-variable
        db.create_all()

    @app.cli.group()
    def users():
        pass

    # @users.command()
    # @click.argument("some_arg")
    # def do_something(some_arg):
    #     ...

    # export FLASK_ENV=develop; export FLASK_DEBUG=1; export FLASK_APP=wsgi; python3 -m flask users obs patkap  # noqa: E501
    @users.command("obs")
    @click.argument("username")
    @with_appcontext
    def obs_for_user(username):  # pylint: disable=unused-variable
        # pylint: disable=import-outside-toplevel
        from geojson import FeatureCollection
        from gncitizen.utils.sqlalchemy import get_geojson_feature

        try:
            user = UserModel.find_by_username(username)
            if user:
                # pylint: disable=comparison-with-callable
                observations = (
                    db.session.query(
                        ObservationModel,
                        UserModel.username,
                        MediaModel.filename.label("image"),
                        LAreas.area_name,
                        LAreas.area_code,
                        Taxref.cd_nom,
                        Taxref.nom_complet,
                        Taxref.nom_vern,
                    )
                    .filter(ObservationModel.id_role == user.id_user)
                    .join(
                        LAreas,
                        LAreas.id_area == ObservationModel.municipality,
                        isouter=True,
                    )
                    .join(
                        ProgramsModel,
                        ProgramsModel.id_program
                        == ObservationModel.id_program,
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
                        Taxref,
                        Taxref.cd_nom == ObservationModel.cd_nom,
                        isouter=True,
                    )
                    .join(
                        UserModel,
                        ObservationModel.id_role == UserModel.id_user,
                        full=True,
                    )
                ).all()
                features = []
                for observation in observations:
                    feature = get_geojson_feature(
                        observation.ObservationModel.geom
                    )
                    feature["properties"]["municipality"] = {
                        "name": observation.area_name,
                        "code": observation.area_code,
                    }
                    feature["properties"]["observer"] = {
                        "username": observation.username
                    }
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
                    observation_dict = observation.ObservationModel.as_dict(
                        True
                    )
                    observation_dict.update(
                        {
                            "nom_complet": observation.nom_complet,
                            "nom_vern": observation.nom_vern,
                        }
                    )
                    for k in observation_dict:
                        if (
                            k in {*obs_keys, "nom_complet", "nom_vern"}
                            and k != "municipality"
                        ):
                            feature["properties"][k] = observation_dict[k]

                    features.append(feature)

                print(json.dumps(FeatureCollection(features), indent=4))
            else:
                print(f"no such user: `{username}`")
        except Exception as e:
            print(str(e))
