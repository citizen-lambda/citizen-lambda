#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from flask import current_app
from geoalchemy2 import func
from geoalchemy2.shape import WKBElement

from gncitizen.core.ref_geo.models import BibAreasTypes, LAreas
from gncitizen.utils.env import db

logger = current_app.logger
# Get municipality id
#       newobs.municipality = get_municipality_id_from_wkb_point(
#           db, newobs.geom
#       )


def get_municipality_id_from_wkb(wkb: WKBElement):
    """Return municipality id from wkb geometry

    :param wkb: WKB geometry (epsg 4326)
    :type wkb: str

    :return: municipality id
    :rtype: int
    """
    try:
        # FIXME: SRID determination belongs to app/repo initialization
        srid = db.session.query(func.Find_SRID("ref_geo", "l_areas", "geom")).one()[0]
        logger.info("Geometry Repository SRID: {} 🌐".format(srid))
    except Exception as e:
        logger.critical("Can't get geometry repository srid: {}".format(str(e)))
        raise

    try:
        query = (
            db.session.query(LAreas)
            .join(BibAreasTypes)
            .filter(
                LAreas.geom.ST_Intersects(wkb.ST_Transform(srid)),
                BibAreasTypes.type_name == "Communes",
            )
            .first()
        )
        logger.debug(f"[get_municipality_id_from_wkb_point] Query: {query}")
        municipality_id = query.id_area
        logger.debug(f"[get_municipality_id_from_wkb_point] Id: {municipality_id}")
    except Exception as e:
        logger.debug(f"[get_municipality_id_from_wkb_point] Can't get id: {str(e)}")
        municipality_id = None
        raise
    return municipality_id


def get_area_informations(id_area):
    try:
        query = db.session.query(LAreas).filter(LAreas.id_area == id_area)
        result = query.first()
        area = {}
        area["name"] = result.area_name
        area["code"] = result.area_code
    except Exception as e:
        logger.debug(
            "[get_municipality_id_from_wkb_point] Can't get municipality id: {}".format(
                str(e)
            )
        )
        area = None
        raise
    return area
