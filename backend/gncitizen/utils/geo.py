#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from typing import Annotated, List, Tuple, Union
from functools import partial
from flask import current_app
import geojson
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


# https://en.wikipedia.org/wiki/Winding_number
# http://www.geomalgorithms.com/code.html#:~:text=wn_PnPoly(),a%202D%20polygon
# https://datatracker.ietf.org/doc/html/rfc7946

Latitude = Union[int, float]  # Annotated[Union[int, float], ValueRange(-90, 90)]
Longitude = Union[int, float]  # Annotated[Union[int, float], ValueRange(-180, 180)]
Coordinates = Tuple[Union[int, float], Union[int, float]]


def point_in_polygon2d(point: Coordinates, polygon2d: List[Coordinates],) -> bool:
    p = point
    v = []

    for node in polygon2d:
        v.append(node)

    if v[0] != v[-1]:
        v.append(v[0])

    def is_left(p0: Coordinates, p1: Coordinates, p2: Coordinates) -> Union[int, float]:
        return (p1[1] - p0[1]) * (p2[0] - p0[0]) - (p2[1] - p0[1]) * (p1[0] - p0[0])

    wn = 0
    for i in range(len(v) - 1):
        if v[i][0] <= p[0]:
            if v[i + 1][0] > p[0]:
                if is_left(v[i], v[i + 1], p) > 0:
                    wn += 1
        else:
            if v[i + 1][0] <= p[0]:
                if is_left(v[i], v[i + 1], p) < 0:
                    wn -= 1

    return wn != 0


def point_in_polygon(
    point: geojson.Point, polygon: Union[geojson.Polygon, geojson.MultiPolygon],
) -> bool:
    """
    >>> multi = geojson.MultiPolygon(
    ...     [
    ...         (
    ...             [
    ...                 (5.372005999088287, 43.292218320681535),
    ...                 (5.371668040752411, 43.292142181383625),
    ...                 (5.371839702129364, 43.29175562655459),
    ...                 (5.371928215026855, 43.29176734037339),
    ...                 (5.371850430965424, 43.29193523819489),
    ...                 (5.372105240821838, 43.29199185479762),
    ...                 (5.372005999088287, 43.292218320681535),
    ...             ],
    ...             [
    ...                 (5.371834337711334, 43.29246040396974),
    ...                 (5.371928215026855, 43.292247605001506),
    ...                 (5.372161567211151, 43.29230422131346),
    ...                 (5.3720623254776, 43.29251311552573),
    ...                 (5.371834337711334, 43.29246040396974),
    ...             ],
    ...         ),
    ...         (
    ...             [
    ...                 (5.371794104576111, 43.2920718988702),
    ...                 (5.371925532817841, 43.29210313555287),
    ...                 (5.371960401535034, 43.292017234636916),
    ...                 (5.3718262910842896, 43.29198404561415),
    ...                 (5.371794104576111, 43.2920718988702),
    ...             ]
    ...         ),
    ...     ]
    ... )
    >>> simple = geojson.Polygon(
    ...     [
    ...         [
    ...             (5.372005999088287, 43.292218320681535),
    ...             (5.371668040752411, 43.292142181383625),
    ...             (5.371839702129364, 43.29175562655459),
    ...             (5.371928215026855, 43.29176734037339),
    ...             (5.371850430965424, 43.29193523819489),
    ...             (5.372105240821838, 43.29199185479762),
    ...             (5.372005999088287, 43.292218320681535),
    ...         ],
    ...         [
    ...             (5.371794104576111, 43.2920718988702),
    ...             (5.371925532817841, 43.29210313555287),
    ...             (5.371960401535034, 43.292017234636916),
    ...             (5.3718262910842896, 43.29198404561415),
    ...             (5.371794104576111, 43.2920718988702),
    ...         ],
    ...     ]
    ... )
    >>> inside_point = geojson.Point([5.371968448162078, 43.29213437221949])
    >>> inhole_point = geojson.Point([5.371869206428528, 43.292036757583])
    >>> point_in_polygon(inside_point, simple)
    True
    >>> not (point_in_polygon(inhole_point, simple))
    True
    >>> point_in_polygon(inside_point, multi)
    True
    >>> not (point_in_polygon(inhole_point, multi))
    True
    >>> not (point_in_polygon(geojson.Point([4.298, 44.590]), multi))
    True
    """

    pt = point["coordinates"][0:2]

    if polygon["type"] == "Polygon":
        outer, *inners = polygon["coordinates"]
        return all(
            [
                point_in_polygon2d(pt, outer),
                not (any(list(map(partial(point_in_polygon2d, pt), inners)))),
            ]
        )

    elif polygon["type"] == "MultiPolygon":
        outers, inners = (
            polygon["coordinates"][0],
            polygon["coordinates"][1:],
        )
        return all(
            [
                any(list(map(partial(point_in_polygon2d, pt), outers))),
                not (any(list(map(partial(point_in_polygon2d, pt), inners)))),
            ]
        )

    else:
        raise TypeError("Not a geojson (Multi)Polygon.")


if __name__ == "__main__":
    import doctest

    # python3 point_in_polygon.py -v
    doctest.testmod()
