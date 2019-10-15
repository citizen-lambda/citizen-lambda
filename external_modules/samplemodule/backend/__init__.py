from flask import current_app

from . import models  # noqa: F401


module_name = '.'.join(__name__.split('.')[:-1])
current_app.logger.info(f":{module_name} loading")
