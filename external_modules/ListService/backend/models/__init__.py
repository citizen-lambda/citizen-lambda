from .. import (  # noqa: F401
    current_app,
    db as _repo
)


SCHEMA = 'gnc_lists'
logger = current_app.logger


def create_schema(_db):
    # fetch schema name from load_toml
    # try:
    #     result = db.session.execute(f"CREATE SCHEMA IF NOT EXISTS {SCHEMA};")
    #     return result is not None
    # except Exception as e:
    #     raise e
    ...
