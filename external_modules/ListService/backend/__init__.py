from flask import (  # noqa: F401
    current_app,
    Blueprint
)

from server import db  # noqa: F401
from gncitizen.core.taxonomy import TAXA  # noqa: F401
from gncitizen.core.taxonomy.taxon import (  # noqa: F401
    Taxon, TaxonMedium, TaxonMedia
)

from . import models  # noqa: F401


module_name = '.'.join(__name__.split('.')[:-1])
logger = current_app.logger
logger.info(f":{module_name} loading 🦓")
