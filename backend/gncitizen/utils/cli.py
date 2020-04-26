import json
import click
from flask.cli import with_appcontext

from gncitizen.utils.env import db
from gncitizen.core.observations.commands import export4user

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
    # pylint: disable=unused-variable
    def db_create_all():
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
    # pylint: disable=unused-variable
    def obs_for_user(username: str) -> None:
        print(json.dumps(export4user(username.strip()), indent=4))
