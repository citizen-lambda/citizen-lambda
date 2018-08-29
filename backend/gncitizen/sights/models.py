#!/usr/bin/python3
# -*- coding: UTF-8 -*-

from datetime import datetime

from geoalchemy2 import Geometry
from server import db
from sqlalchemy import MetaData, Table, Column, Integer, String
from sqlalchemy.dialects.postgresql import UUID


class SpecieModel(db.Model):
    """Table des Espèce"""
    __tablename__ = 'species'
    __table_args__ = {'schema': 'gnc_sights'}
    id_specie = db.Column(db.Integer, primary_key=True, unique=True)
    cd_nom = db.Column(db.Integer, unique=True)
    common_name = db.Column(db.String(150))
    sci_name = db.Column(db.String(150))


class SightModel(db.Model):
    """Table des observations"""
    __tablename__ = 'sights'
    __table_args__ = {'schema': 'gnc_sights'}
    id_sight = db.Column(db.Integer, primary_key=True, unique=True)
    uuid_sinp = db.Column(UUID(as_uuid=True), nullable=False, unique=True)
    cd_nom = db.Column(db.Integer, db.ForeignKey('taxonomie.bib_noms.cd_nom'))
    specie = db.relationship(
        'BibNoms',
        backref=db.backref('specie', lazy='dynamic'))
    date = db.Column(db.DATE, nullable=False)
    id_role = db.Column(db.Integer, db.ForeignKey('gnc_users.users.id_user'))
    obs_txt = db.Column(db.String(150))
    email = db.Column(db.String(150))
    phone = db.Column(db.String(150))
    count = db.Column(db.Integer)
    comment = db.Column(db.String(300))
    geom = db.Column(Geometry('POINT', 4326))
    municipality = db.Column(db.String(5), db.ForeignKey('ref_geo.li_municipalities.id_municipality'))
    timestamp_create = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    photo = db.Column(db.Text)
