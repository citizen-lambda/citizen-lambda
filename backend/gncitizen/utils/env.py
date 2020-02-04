from typing import Dict, Any
import os
import sys
from pathlib import Path
from urllib.parse import urlparse

from flask import current_app
from flasgger import Swagger
from flask_jwt_extended import JWTManager
from flask_sqlalchemy import SQLAlchemy as _BaseSQLAlchemy
from flask_admin import Admin


from gncitizen.utils.toml import load_toml

ROOT_DIR = Path(__file__).absolute().parent.parent.parent.parent
BACKEND_DIR = ROOT_DIR / "backend"
DEFAULT_VIRTUALENV_DIR = BACKEND_DIR / "venv"
with open(str((ROOT_DIR / "VERSION"))) as v:
    GNCITIZEN_VERSION = v.read()
DEFAULT_CONFIG_FILE = ROOT_DIR / "config/default_config.toml"
GNC_EXTERNAL_MODULE = ROOT_DIR / "external_modules"
ALLOWED_EXTENSIONS = set(["png", "jpg", "jpeg"])


def get_config_file_path(config_file=None):
    """ Return the config file path by checking several sources

        1 - Parameter passed
        2 - GNCITIZEN_CONFIG_FILE env var
        3 - Default config file value
    """
    config_file = config_file or os.environ.get("GNCITIZEN_CONFIG_FILE")
    return Path(config_file or DEFAULT_CONFIG_FILE)


def load_config(config_file=None):
    """ Load the geonature-citizen configuration from a given file"""
    config_gnc = load_toml(get_config_file_path())

    return config_gnc


app_conf = load_config()
MEDIA_DIR = str(ROOT_DIR / app_conf["MEDIA_FOLDER"])
SQLALCHEMY_DATABASE_URI = app_conf["SQLALCHEMY_DATABASE_URI"]
# current_app.db.close_all_sessions()
class SQLAlchemy(_BaseSQLAlchemy):
    def apply_pool_defaults(self, app, options):
        super(SQLAlchemy, self).apply_pool_defaults(app, options)
        options["pool_pre_ping"] = True

db = SQLAlchemy()

jwt = JWTManager()

swagger_template: Dict[str, Any] = {
    # "openapi": "3.0.0",
    # "components": {
    #     "securitySchemes": {
    #         "bearerAuth": {
    #             "type": "http",
    #             "scheme": "bearer",
    #             "bearerFormat": "JWT",
    #         }
    #     }
    # },
}

swagger = Swagger(template=swagger_template)

admin = Admin(
    name="GN-Citizen: Backoffice d'administration",
    template_mode="bootstrap3",
    url="/".join([urlparse(app_conf["API_ENDPOINT"]).path, "admin"]),
)

taxhub_url = app_conf.get("API_TAXHUB", "")
taxhub_lists_url = taxhub_url + "biblistes/"


def list_and_import_gnc_modules(app, mod_path=GNC_EXTERNAL_MODULE):
    """
        Get all the module enabled from gn_commons.t_modules
    """
    # with app.app_context():
    #     data = db.session.query(TModules).filter(
    #         TModules.active_backend == True
    #     )
    #     enabled_modules = [d.as_dict()['module_name'] for d in data]

    # iter over external_modules dir
    #   and import only modules which are enabled
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
                f":{manifest['module_name']} loaded ✨ {app_conf['API_ENDPOINT']}{conf_module['api_url']} ✨")  # noqa: E501

            yield conf_module, manifest, module_blueprint
