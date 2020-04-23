from flask import current_app
from . import models  # noqa: F401  unused

module_name = ".".join(__name__.split(".")[:-1])
logger = current_app.logger
logger.info(f":{module_name} loading 🦓")
