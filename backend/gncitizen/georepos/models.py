from geoalchemy2 import Geometry

from server import db


class LAreas(db.Model):
    __tablename__ = 'l_areas'
    __table_args__ = {'schema': 'ref_geo'}
    id_area = db.Column(db.Integer, primary_key=True)
    id_type = db.Column(db.Integer,  db.ForeignKey('ref_geo.bib_areas_types.id_type'))
    area_name = db.Column(db.Unicode)
    area_code = db.Column(db.Unicode)
    source = db.Column(db.Unicode)
    geom = db.Column(Geometry('GEOMETRY', 4326))


class BibAreasTypes(db.Model):
    __tablename__ = 'bib_areas_types'
    __table_args__ = {'schema': 'ref_geo'}
    id_type = db.Column(db.Integer, primary_key=True)
    type_name = db.Column(db.Unicode)
    type_code = db.Column(db.Unicode)
    type_desc = db.Column(db.Unicode)
    ref_name = db.Column(db.Unicode)
    ref_version = db.Column(db.Integer)
    num_version = db.Column(db.Unicode)


class LiMunicipalities(db.Model):
    __tablename__ = 'li_municipalities'
    __table_args__ = {'schema': 'ref_geo'}
    id_municipality = db.Column(db.Unicode, primary_key=True, unique=True)
    nom_com = db.Column(db.Unicode)
    id_area = db.Column(db.Integer,  db.ForeignKey('ref_geo.l_areas.id_area'), unique=True)
    insee_com = db.Column(db.Integer)