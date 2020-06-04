import asyncio
import configparser
import logging
import sys
from json.decoder import JSONDecodeError
from operator import itemgetter
from timeit import default_timer as timer
from typing import Optional, Sequence, Union

import aiodebug.log_slow_callbacks

from aiohttp import web

import asyncpg
from asyncpg.exceptions import InternalServerError


# dev: ptw --runner "pytest --testmon"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s,%(msecs)d %(levelname)s: %(message)s",
    datefmt="%H:%M:%S",
)
aiodebug.log_slow_callbacks.enable(0.05)


async def handle(request: web.Request) -> web.Response:
    if request.method == "POST":
        try:
            data = await request.json()
            request.app["point"] = data["point"]
            return web.Response(body=b"thanks for the data")
        except (KeyError, TypeError, ValueError) as exc:
            raise web.HTTPBadRequest(
                text=f"You have not specified point value. {str(exc)}"
            ) from exc
    name = request.match_info.get("name", "Anonymous")
    text = "Hello, " + name
    return web.Response(text=text)


def fix_missing_srid(ewkt: str) -> str:
    # todo: actually check for valid geometry
    if not ewkt.startswith("SRID="):
        return f"SRID=4326;{ewkt}"
    return ewkt


def filter_levels(levels: Optional[str]) -> Optional[str]:
    if (
        levels
        and isinstance(levels, str)
        and levels
        in {"fr:region", "fr:departement", "fr:arrondissement", "fr:commune"}
    ):
        return f"AND level = '{levels}'"
    if (
        levels
        and isinstance(levels, list)
        and all(
            level
            in {
                "fr:region",
                "fr:departement",
                "fr:arrondissement",
                "fr:commune",
            }
            for level in levels
        )
    ):
        return "AND level IN ('" + "', '".join(levels) + "')"
    return None


async def ewkt_intersects(
    app: web.Application,
    ewkt: str,
    filters: Optional[Union[str, Sequence[str]]],
) -> str:
    async with app["pool"].acquire() as connection:
        async with connection.transaction():
            stmt = f"""\
SELECT jsonb_build_object(
    'type',       'Feature',
    'id',         id,
    'geometry',   ST_AsGeoJSON(geometry)::jsonb,
    'properties', to_jsonb(feature) - 'geometry'
) AS data FROM (SELECT * FROM {app["table"]}) feature
WHERE ST_Intersects(
    geometry,
    ST_Transform(ST_GeomFromEWKT($1), 4326)
)
{filters}
ORDER BY level, code;
"""
            query = await connection.prepare(stmt)
            results = await query.fetch(ewkt)
            return "[" + ",".join(map(itemgetter("data"), results)) + "]"


async def geom_intersects(request: web.Request) -> web.Response:
    """
    Accepts a JSON formatted POST data map in the form of:
        - "geom": a `geometry` in EWKT format
        - "levels": a list of strings to filter level category from.
    … {"geom": "POINT(5.415301 43.286437)", "levels": ["fr:arrondissement", "fr:commune"]}

    Returns a list of geojson features intersecting the geometry

    TODO: validation effort, accept simple (lon, lat) tuple, make Point(lon, lat) and intersect
    """
    start = timer()
    if request.method == "POST":
        try:
            data = await request.json()
        except JSONDecodeError as exc:
            raise web.HTTPBadRequest(text=f"Invalid JSON data. {str(exc)}")

        geom = data.get("geom")
        levels = data.get("levels")
        if not geom or not levels:
            missing = (
                "the values of the `geom` and `levels` options"
                if (not geom and not levels)
                else "the value of `geom` option"
                if not geom
                else "the value of `levels` option"
            )
            return web.json_response(
                {
                    "error": "No geometry provided.",
                    "message": f"You have not specified {missing}",
                },
                status=400,
            )

        # TODO: validate Geometry, see fix_missing_srid
        geom = fix_missing_srid(geom)
        filters = filter_levels(levels)
        try:
            results = await ewkt_intersects(request.app, geom, filters)
            end = timer()
            print(end - start)
            return web.Response(text=results, content_type="application/json")
        except InternalServerError as exc:
            raise web.HTTPBadRequest(text=f"Invalid query. {str(exc)}")

    # no GET ?
    return web.json_response(
        {
            "error": "Invalid Method.",
            "message": f"Utilize HTTP POST method to submit your data.",
        },
        status=400,
    )


async def init_app(config: configparser.ConfigParser) -> web.Application:
    app = web.Application()
    app["pool"] = await asyncpg.create_pool(config.get("db", "dsn"))
    app["table"] = config.get("db", "table")
    app.add_routes(
        [
            web.get("/", handle),
            web.post("/", handle),
            web.get("/hello/{name}", handle),
            web.post("/hello/{name}", handle),
            web.post("/intersects", geom_intersects),
        ]
    )
    return app


def get_conf(config_file="geom.conf") -> configparser.ConfigParser:
    config = configparser.ConfigParser()
    if not config.read(config_file):
        print(f"Unable to read {config_file}")
        sys.exit(1)
    return config


def main(conf: str = "geom.conf") -> None:

    config = get_conf(conf)
    loop = asyncio.get_event_loop()
    app = loop.run_until_complete(init_app(config))
    # if gunicorn: return app
    try:
        web.run_app(
            app,
            host=config.get("web", "host"),
            port=config.getint("web", "port"),
        )
    except KeyboardInterrupt:
        pass
    finally:
        for task in asyncio.Task.all_tasks():
            task.cancel()
        loop.close()


if __name__ == "__main__":

    def enable_ptvsd(toggle: bool) -> None:
        if toggle:
            if "ptvsd" not in sys.modules:
                import ptvsd  # pylint: disable=import-outside-toplevel
            print("Waiting for debugger attach")
            # 5678 is the default attach port in the VS Code debug configurations
            ptvsd.enable_attach(address=("localhost", 5678))
            ptvsd.wait_for_attach()

    enable_ptvsd(False)
    main()
