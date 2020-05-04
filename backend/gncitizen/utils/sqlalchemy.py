# coding: utf-8

"""A module to manage database and datas with sqlalchemy"""

from typing import Dict, Optional, Tuple
from flask import current_app
from geoalchemy2.shape import from_shape, to_shape
from geojson import Feature
from shapely.geometry import asShape


SERIALIZERS = {
    "date": lambda x: str(x) if x else None,
    "datetime": lambda x: str(x) if x else None,
    "time": lambda x: str(x) if x else None,
    "timestamp": lambda x: str(x) if x else None,
    "uuid": lambda x: str(x) if x else None,
    "numeric": lambda x: str(x) if x else None,
    "float": lambda x: str(x) if x else None,
}


def create_schemas(db):
    """create db schemas at first launch

    :param db: db connection
    """
    db.session.execute("CREATE SCHEMA IF NOT EXISTS gnc_core")
    db.session.execute("CREATE SCHEMA IF NOT EXISTS gnc_obstax")
    db.session.execute("CREATE SCHEMA IF NOT EXISTS ref_geo")
    db.session.commit()
    current_app.logger.debug("[create_schemas] Schemas created")


def geom_from_geojson(geojson: str) -> Optional[bytes]:
    """this function transform geojson geometry into `WKB\
    <https://en.wikipedia.org/wiki/Well-known_text_representation_of_geometry#Well-known_binary>`_\
    geojson commonly used in PostGIS geometry fields """
    try:
        shape = asShape(geojson)
        wkb = bytes(from_shape(shape, srid=4326))
        if len(wkb) > 0:
            return wkb
        raise Exception("Failed to produce WKBElement from shape")
    except Exception as e:
        current_app.logger.error(
            "[geom_from_geojson] Can't convert geojson geometry to wkb: %s", str(e),
        )
        return None


def get_geojson_feature(wkb: bytes) -> Optional[Feature]:
    """ return a geojson feature from WKB """
    try:
        geometry = to_shape(wkb)
        return Feature(geometry=geometry, properties=dict())
    except Exception as e:
        current_app.logger.error(
            "[get_geojson_feature] Can't convert wkb geometry to geojson: %s", str(e),
        )
        return None


def serializable(cls):
    # Décorateur de classe pour les DB.Models
    # Permet de rajouter la fonction as_dict
    # qui est basée sur le mapping SQLAlchemy

    # Liste des propriétés sérialisables de la classe
    # associées à leur sérializer en fonction de leur type
    cls_db_columns = [
        (
            db_col.key,
            SERIALIZERS.get(db_col.type.__class__.__name__.lower(), lambda x: x),
        )
        for db_col in cls.__mapper__.c
        if db_col.type.__class__.__name__ != "Geometry"
    ]

    # Liste des propriétés de type relationship
    # uselist permet de savoir si c'est une collection de sous objet
    # sa valeur est déduite du type de relation
    # (OneToMany, ManyToOne ou ManyToMany)

    cls_db_relationships = [
        (db_rel.key, db_rel.uselist) for db_rel in cls.__mapper__.relationships
    ]

    def serializefn(self, recursive: bool = False, columns: Tuple = ()) -> Dict:
        """
        Méthode qui renvoie les données de l'objet sous la forme d'un dict

        Parameters
        ----------
            recursive: boolean
                Spécifie si on veut que les sous objet (relationship)
                soit également sérialisé
            columns: tuple
                liste des colonnes qui doivent être prises en compte
        """
        if columns:
            fprops = list(filter(lambda d: d[0] in columns, cls_db_columns))
        else:
            fprops = cls_db_columns

        out = {item: _serializer(getattr(self, item)) for item, _serializer in fprops}

        if recursive is False:
            return out

        for (rel, uselist) in cls_db_relationships:
            if getattr(self, rel) is None:
                break

            if uselist is True:
                out[rel] = [x.as_dict(recursive) for x in getattr(self, rel)]
            else:
                out[rel] = getattr(self, rel).as_dict(recursive)

        return out

    cls.as_dict = serializefn
    return cls


def geoserializable(cls):
    """
        Décorateur de classe
        Permet de rajouter la fonction as_geofeature à une classe
    """

    def serializegeofn(
        self,
        geo_colname: str,
        id_colname: str,
        recursive: bool = False,
        columns: Tuple = (),
    ) -> Feature:
        """ Méthode qui renvoie les données de l'objet sous la forme
        d'une Feature geojson """
        geometry = to_shape(getattr(self, geo_colname))
        feature = Feature(
            id=str(getattr(self, id_colname)),
            geometry=geometry,
            properties=self.as_dict(recursive, columns),
        )
        return feature

    cls.as_geofeature = serializegeofn
    return cls
