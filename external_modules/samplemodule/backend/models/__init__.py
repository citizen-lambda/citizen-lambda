from server import db
from flask import current_app


SCHEMA = 'gnc_logs'
logger = current_app.logger


class EventLog(db.Model):
    __tablename__ = 't_logs'
    __table_args__ = {'schema': SCHEMA}
    id = db.Column(db.Integer, primary_key=True, nullable=False)  # noqa: A003
    # id_role = db.Column(db.Integer, db.ForeignKey(TRoles.id_role))
    # role = db.relationship('TRoles', foreign_keys=[id_role], lazy='joined')
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime)
    status = db.Column(db.Integer, default=-2)
    log = db.Column(db.Text)

    def __init__(
        self,
        # id_role,
        start_time,
        end_time,
        status,
        log
    ):
        # self.id_role = id_role
        self.start_time = start_time
        self.end_time = end_time
        self.status = status
        self.log = log

    @classmethod
    def from_dict(cls, adict):
        return EventLog(
            # id_role=adict['id_role'],
            start_time=adict['start_time'],
            end_time=adict['end_time'],
            status=adict['status'],
            log=adict['log'])

    @classmethod
    def record(cls, adict):
        try:
            x = EventLog.from_dict(adict)
            db.session.add(x)
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            raise e('Echec de journalisation.')


def create_schema(db):
    try:
        result = db.session.execute(f"CREATE SCHEMA IF NOT EXISTS {SCHEMA};")
        return result is not None
    except Exception as e:
        raise e
