import os
import sys
from pathlib import Path
from urllib.parse import urlparse
from datetime import datetime

from flask import current_app
from flasgger import (  # noqa: F401
    Swagger,
    LazyString,
    LazyJSONEncoder as LazyJSONEncoder,
)
from flask_jwt_extended import JWTManager
from flask_sqlalchemy import SQLAlchemy
from flask_admin import Admin


from gncitizen.utils.toml_helper import load_toml

ROOT_DIR = Path(__file__).absolute().parent.parent.parent.parent
BACKEND_DIR = ROOT_DIR / "backend"
DEFAULT_VIRTUALENV_DIR = BACKEND_DIR / "venv"
with open(str((ROOT_DIR / "VERSION"))) as v:
    GNCITIZEN_VERSION = v.read()
DEFAULT_CONFIG_FILE = ROOT_DIR / "config/default_config.toml"
GNC_EXTERNAL_MODULE = ROOT_DIR / "external_modules"


def get_config_file_path(config_file=None):
    """ Return the config file path by checking several sources

        1 - Parameter passed
        2 - GNCITIZEN_CONFIG_FILE env var
        3 - Default config file value
    """
    config_file = config_file or os.environ.get("GNCITIZEN_CONFIG_FILE")
    return Path(config_file or DEFAULT_CONFIG_FILE)


def load_config():
    """ Load the geonature-citizen configuration from a given file"""
    config_gnc = load_toml(get_config_file_path())

    return config_gnc


app_conf = load_config()
MEDIA_DIR = str(ROOT_DIR / app_conf["MEDIA_FOLDER"])
SQLALCHEMY_DATABASE_URI = app_conf["SQLALCHEMY_DATABASE_URI"]
# current_app.db.close_all_sessions()

db = SQLAlchemy()

jwt = JWTManager()

swagger = Swagger()

admin = Admin(
    name="GN-Citizen: Backoffice d'administration",
    template_mode="bootstrap3",
    url="/".join([urlparse(app_conf["API_ENDPOINT"]).path, "admin"]),
)

taxhub_url = app_conf.get("API_TAXHUB", "")
taxhub_lists_url = taxhub_url + "biblistes/"


def list_and_import_gnc_modules(_app, mod_path=GNC_EXTERNAL_MODULE):
    """
        Get all the module enabled from gn_commons.t_modules
    """
    for path in mod_path.iterdir():
        if path.is_dir():
            manifest = load_toml(str(path / "manifest.toml"))
            name = manifest["module_name"]
            module_path = Path(GNC_EXTERNAL_MODULE / name)
            module_parent_dir = str(module_path.parent)
            module_name = "{}.config.conf_schema_toml".format(module_path.name)
            sys.path.insert(0, module_parent_dir)
            # module = __import__(module_name, globals=globals())
            module_name = "{}.backend.blueprint".format(module_path.name)
            module_blueprint = __import__(module_name, globals=globals())
            sys.path.pop(0)

            conf_module = load_toml(str(path / "config/conf_gn_module.toml"))
            current_app.logger.info(
                f":{manifest['module_name']}"
                f"loaded ✨ {app_conf['API_ENDPOINT']}{conf_module['api_url']} ✨"
            )

            yield conf_module, manifest, module_blueprint


def now() -> datetime:
    return datetime.utcnow()
