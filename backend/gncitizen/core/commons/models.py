#!/usr/bin/python3
# -*- coding: utf-8 -*-

import logging
import queue
from datetime import datetime, timezone

from geoalchemy2 import Geometry
from sqlalchemy import ForeignKey
from sqlalchemy.sql import expression
from sqlalchemy.ext.declarative import declared_attr

from gncitizen.core.taxonomy.models import BibListes
from gncitizen.utils.env import db
from gncitizen.utils.sqlalchemy import serializable, geoserializable


class TimestampMixinModel(object):
    """Structure commune de suivi des modifications d'une table"""

    @declared_attr
    def timestamp_create(cls):
        return db.Column(
            db.DateTime, nullable=False, default=datetime.now(tz=timezone.utc)
        )

    @declared_attr
    def timestamp_update(cls):
        return db.Column(
            db.DateTime,
            nullable=True,
            default=datetime.now(tz=timezone.utc),
            onupdate=datetime.now(tz=timezone.utc),
        )


@serializable
class ModulesModel(TimestampMixinModel, db.Model):
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
class ProgramsModel(TimestampMixinModel, db.Model):
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
        db.Integer,
        ForeignKey(ModulesModel.id_module),
        nullable=False,
        default=1,
    )
    taxonomy_list = db.Column(
        db.Integer, ForeignKey(BibListes.id_liste), nullable=True
    )
    is_active = db.Column(
        db.Boolean(), server_default=expression.true(), default=True
    )
    geom = db.Column(Geometry("GEOMETRY", 4326))

    def get_geofeature(self, recursif=True, columns=None):
        return self.as_geofeature(
            "geom", "id_program", recursif, columns=columns
        )


@serializable
@geoserializable
class MediaModel(TimestampMixinModel, db.Model):
    """Table des media de GeoNature-citizen """

    __tablename__ = "t_medias"
    __table_args__ = {"schema": "gnc_core"}
    id_media = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(50), nullable=False)


class FrontendBroadcastHandler(logging.Handler):
    def __init__(self):
        logging.Handler.__init__(self)
        self.subscriptions = []

    def emit(self, record):
        try:
            msg = self.format(record)
            print(msg)

            def notify(subs, msg):
                for sub in subs[:]:
                    sub.put(msg)

            # ?
            notify(self.subscriptions, msg)

        except (KeyboardInterrupt, SystemExit):  # noqa: W0706
            raise
        except Exception:
            self.handleError(record)

    def subscribe(self):
        q = queue.Queue()
        self.subscriptions.append(q)
        try:
            yield f"hello eventSource\n\n"
            while True:
                result = q.get()
                yield f"{result}\n\n"
        except GeneratorExit:
            self.subscriptions.remove(q)
