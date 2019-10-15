import logging
from flask import (
    Blueprint,
    # request,
    current_app,
    # jsonify,
    # send_from_directory
)


logger = current_app.logger
logger.setLevel(logging.DEBUG)
# logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)
# current_app.config['DEBUG'] = True

blueprint = Blueprint('samplemodule', __name__)


@blueprint.route('/', methods=['GET'])
def default():
    return {"message": "it works."}
