import click
from flask.cli import with_appcontext
from flask import json

from gncitizen.utils.env import db
from gncitizen.core.taxonomy.models import Taxref, TMedias
from gncitizen.core.ref_geo.models import LAreas
from gncitizen.core.commons.models import MediaModel, ProgramsModel
from gncitizen.core.observations.models import ObservationModel, ObservationMediaModel
from gncitizen.core.users.models import UserModel


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
    def db_create_all():
        db.create_all()

    @app.cli.group()
    def users():
        pass

    """
    @users.command()
    @click.argument("some_arg")
    def do_something(some_arg):
        ...
    """

    # @users.command("allusers")
    # @with_appcontext
    # def all_users():
    #     print(json.dumps([UserModel.return_all()], indent=4))

    @users.command("allObsForUser")
    @click.argument("username")
    @with_appcontext
    def allObsForUser(username):
        user = UserModel.query.filter(UserModel.username == username).one()
        # results = ObservationModel.query.filter(
        #     ObservationModel.id_role == user.id_user
        # ).all()
        # print(json.dumps([result.as_dict() for result in results], indent=4))
        results = (
            db.session.query(
                ObservationModel,
                # UserModel.username,
                UserModel,
                # MediaModel.filename.label("image"),
                MediaModel,
                LAreas,
                Taxref,
                TMedias,
                ProgramsModel,
            )
            .filter(ObservationModel.id_role == user.id_user)
            .join(LAreas, LAreas.id_area == ObservationModel.municipality, isouter=True)
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
            .join(Taxref, Taxref.cd_nom == ObservationModel.cd_nom, isouter=True)
            .join(TMedias, TMedias.cd_ref == ObservationModel.cd_nom, isouter=True)
            # .join(UserModel, ObservationModel.id_role == UserModel.id_user, full=True)
        )

        # print([result for result in results])
        print(json.dumps([item.as_dict() for item in results[0]], indent=4))
