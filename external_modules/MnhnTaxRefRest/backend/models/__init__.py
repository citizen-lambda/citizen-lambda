# from server import db
from flask import current_app


# SCHEMA = 'gnc_logs'
logger = current_app.logger


def create_schema(db):
    # try:
    #     result = db.session.execute(f"CREATE SCHEMA IF NOT EXISTS {SCHEMA};")
    #     return result is not None
    # except Exception as e:
    #     raise e
    ...
