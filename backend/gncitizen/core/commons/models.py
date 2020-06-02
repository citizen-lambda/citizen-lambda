# coding: utf-8

import logging
import queue
from datetime import datetime, timezone
from flask import json

from geoalchemy2 import Geometry
from sqlalchemy import ForeignKey
from sqlalchemy.sql import expression
from sqlalchemy.ext.declarative import declared_attr

from gncitizen.core.taxonomy.models import BibListes  # todo: rm
from gncitizen.utils.env import db
from gncitizen.utils.sqlalchemy import serializable, geoserializable


class TimestampCreateMixinModel:
    """Structure commune de suivi des modifications d'une table: creation d'un enregistrement
    Common structure for tracking changes to a table: record created"""  # noqa: E501

    @declared_attr
    def timestamp_create(self):
        return db.Column(
            db.DateTime, nullable=False, default=datetime.now(tz=timezone.utc)
        )


class TimestampMixinModel(TimestampCreateMixinModel):
    """Structure commune de suivi des modifications d'une table: màj d'un enregistrement
    Common structure for tracking changes to a table: record updated"""

    @declared_attr
    def timestamp_update(self):
        return db.Column(
            db.DateTime,
            nullable=True,
            default=datetime.now(tz=timezone.utc),
            onupdate=datetime.now(tz=timezone.utc),
        )


@serializable
class ModulesModel(
    TimestampMixinModel, db.Model  # type: ignore
):
    """Table des modules de GeoNature-citizen"""

    __tablename__ = "t_modules"
    __table_args__ = {"schema": "gnc_core"}
    id_module = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    label = db.Column(db.String(50), nullable=False)
    desc = db.Column(db.String(200))
    icon = db.Column(db.String(250))
    on_sidebar = db.Column(db.Boolean(), default=False)


@serializable
@geoserializable
class ProgramsModel(
    TimestampMixinModel, db.Model  # type: ignore
):
    """Table des Programmes de GeoNature-citizen"""

    __tablename__ = "t_programs"
    __table_args__ = {"schema": "gnc_core"}
    id_program = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(50), nullable=False)
    short_desc = db.Column(db.String(200), nullable=False)
    long_desc = db.Column(db.Text(), nullable=False)
    image = db.Column(db.String(250))
    logo = db.Column(db.String(250))
    module = db.Column(
        db.Integer, ForeignKey(ModulesModel.id_module), nullable=False, default=1,
    )
    taxonomy_list = db.Column(
        db.Integer, ForeignKey(BibListes.id_liste), nullable=True  # todo: rm
    )
    is_active = db.Column(db.Boolean(), server_default=expression.true(), default=True)
    geom = db.Column(Geometry("GEOMETRY", 4326))

    def get_geofeature(self, recursive=True, columns=None):
        return self.as_geofeature("geom", "id_program", recursive, columns=columns)


@serializable
@geoserializable
class MediaModel(
    TimestampMixinModel, db.Model  # type: ignore
):
    """Table des media de GeoNature-citizen """

    __tablename__ = "t_medias"
    __table_args__ = {"schema": "gnc_core"}
    id_media = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(50), nullable=False)


class FrontendBroadcastHandler(logging.Handler):
    """
    https://html.spec.whatwg.org/multipage/server-sent-events.html

    testing in the browser console:
        var source = new EventSource('http://localhost:4200/api/programs/stream?ngsw-bypass=1');
            source.onmessage = function(e) {
            console.log(e);
            console.log(e.data);
        };
        …
        source.close()
    limitation: max-number of open connection per browser & domain is 6
    """  # noqa: E501

    def __init__(self):
        logging.Handler.__init__(self)
        self.subscriptions = []

    def emit(self, record):
        try:
            msg = self.format(record)

            def notify(subs, msg):
                for sub in subs[:]:
                    sub.put(msg)

            notify(self.subscriptions, msg)

        except (KeyboardInterrupt, SystemExit):
            print("Interrupt signal, exiting")
            raise
        except Exception:
            self.handleError(record)

    def subscribe(self):
        q = queue.Queue()
        self.subscriptions.append(q)

        welcome_event = self.mk_event(
            json.dumps(
                {"type": "message", "data": {"message": "hello , welcome on citizenλ!"}}
            )
        )
        try:
            yield welcome_event
            while True:
                result = ""
                try:
                    result = q.get(timeout=30)
                except queue.Empty:
                    result = json.dumps(
                        {
                            "type": "ping",
                            "data": {"time": datetime.now(tz=timezone.utc)},
                        },
                    )

                yield self.mk_event(result)
        except GeneratorExit:
            self.subscriptions.remove(q)

    def mk_event(self, json_encoded_message: str) -> str:
        message = json.loads(json_encoded_message)
        event_type = message["type"]
        event_data = message["data"]
        # print("message", message, "type", event_type, "data", event_data)
        return f"""\
event: {event_type}
retry: 1000
id: {datetime.now(tz=timezone.utc).timestamp()}
data: {json.dumps(event_data)}

"""
