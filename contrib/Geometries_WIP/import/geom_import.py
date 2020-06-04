#! /usr/bin/env python3
# encoding: utf-8

"""
Référentiel géospatial et administratif simple.
https://www.data.gouv.fr/fr/datasets/geozones/
"""

from typing import (
    Any,
    AsyncIterable,
    Callable,
    Iterable,
    List,
    Mapping,
    NamedTuple,
    Optional,
    Sequence,
    Tuple,
    TypeVar,
    Union,
)
import sys
import os
from functools import reduce, partial
import contextlib
import itertools
import asyncio
import asyncpg
import tarfile
import geojson
import urllib.request
import shapely.geometry
import shapely.wkb
from timeit import default_timer as timer
from urllib.parse import urlparse
from pathlib import Path


if shapely.speedups.available:
    shapely.speedups.enable()


StorageType = str
StorageConstraint = Optional[str]


class Storage(NamedTuple):
    type_: StorageType
    constraints: StorageConstraint = None


class Operation(NamedTuple):
    operation: Callable
    arg: Any = None


# dst_key | db_type, opt(db_history_constraints) | seq(op_key, args)
ScriptConfig = Mapping[str, Tuple[Storage, List[Operation]]]


class Config(NamedTuple):
    levels: List[str]
    dsn: str
    zones_archive_url: str
    zones_archive: str
    zones_file: str
    data_dir: str
    table: str
    drop_table: bool
    batch: int
    script: ScriptConfig


class Progress(NamedTuple):
    counter: int = 0
    total: int = 0


class ExtractionProgress(NamedTuple):
    progress: Progress
    datum: Mapping[str, Any]


def encode_geometry(geometry: geojson.geometry.Geometry) -> Any:
    if not hasattr(geometry, "__geo_interface__"):
        # https://gist.github.com/sgillies/2217756
        raise TypeError(
            f"geometry {geometry} does not comply with the __geo_interface__"
        )
    shape = shapely.geometry.asShape(geometry)
    return shapely.wkb.dumps(shape, srid=4326)


def decode_geometry(wkb: bytes) -> Any:
    return shapely.wkb.loads(wkb)


async def configure_connection(db: asyncpg.Connection) -> None:
    await db.execute("SET CLIENT_ENCODING TO 'UTF8';")
    await db.set_type_codec(
        "geometry",  # 'geography'
        encoder=encode_geometry,
        decoder=decode_geometry,
        format="binary",
    )


def schema_table_from_tablename(tablename: str) -> Sequence[Optional[str]]:
    return tablename.split(".")


def create_db_type_stmt(config: Config) -> str:
    return f"""\
DO
$$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t
            INNER JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = current_schema()
            AND t.typname = 'geo_admin_level'
    ) THEN CREATE TYPE GEO_ADMIN_LEVEL AS ENUM ('{"', '".join(config.levels)}');
    END IF;
END
$$
LANGUAGE plpgsql;
"""


# def load_sql_query(name):
#     path = Path(__file__).parent / 'sql' / name
#     with path.open() as f:
#         return f.read()
#
# create_db_table_stmt = load_sql_query('pg_create_feature_table.sql')


def create_db_table_stmt(config: Config) -> str:
    # TODO: Derive from conf
    return f"""\
CREATE TABLE {config.table}
(
    code character varying NOT NULL,
    name text NOT NULL,
    color character varying,
    population bigint,
    area float(6),
    level GEO_ADMIN_LEVEL NOT NULL,
    blazon character varying,
    postal character varying[],
    wikipedia text,
    geometry geometry(MultiPolygon, 4326) NOT NULL,
    id character varying PRIMARY KEY,
    validity character varying
);"""


async def recreate_feature_table(db: asyncpg.Connection, config: Config) -> str:
    PostGIS_Version = await db.fetchval("SELECT PostGIS_Version();")
    # SELECT PostGIS_Version(); -> '3.0 USE_GEOS=1 USE_PROJ=1 USE_STATS=1'
    stmts = []
    pg_schema, pg_table = schema_table_from_tablename(config.table)
    if all([pg_schema, pg_table]):
        stmts.append(f"""CREATE SCHEMA IF NOT EXISTS {pg_schema};""")
        stmts.append("CREATE EXTENSION IF NOT EXISTS postgis;")
        # postgresql-12-postgis-3
        if len(PostGIS_Version) > 0 and PostGIS_Version.startswith("3"):
            stmts.append("CREATE EXTENSION IF NOT EXISTS postgis_raster;")
        stmts.append(f"""DROP TABLE IF EXISTS {pg_schema}.{pg_table};""")
    else:
        stmts.append(f"""DROP TABLE IF EXISTS {config.table};""")
    stmts.append(create_db_type_stmt(config))
    stmts.append(create_db_table_stmt(config))
    resp = await db.execute("".join(stmts))
    assert resp, "CREATE TABLE"
    return resp


async def batch_import(
    db: asyncpg.Connection, records: Sequence[Mapping[str, Any]], table: str
) -> Any:
    pg_schema, pg_table = schema_table_from_tablename(table)
    recs = tuple(tuple(field for field in record.values()) for record in records)
    try:
        # [("row", 1, "some data"), ("row", 2, "more data"), …] -> 'COPY 2'
        return await db.copy_records_to_table(
            pg_table, records=recs, schema_name=pg_schema
        )
    except Exception as exc:
        print(
            # records,
            str(exc)
        )
        raise


_T = TypeVar("_T")


async def async_filter(
    pred: Callable[..., _T], collection: Iterable[_T]
) -> AsyncIterable[_T]:
    for item in collection:
        if pred(item):
            yield item


async def load_data(geojson_file: str) -> geojson.FeatureCollection:
    def load(geojson_file: str) -> geojson.FeatureCollection:
        try:
            with open(geojson_file, mode="rb", encoding=None) as f:
                return geojson.load(f)
        except OSError:
            print(f"File not found: {geojson_file}")
            raise

    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, partial(load, geojson_file))


def want_feature(config: Config, feature: geojson.Feature) -> bool:
    return (
        (feature["geometry"] is not None)
        and any(level in feature["properties"]["level"] for level in config.levels)
        # and (
        #     "validity" in feature["properties"]
        #     and feature["properties"]["validity"].get("end") is None
        # )
    )


async def selected_features(
    config: Config, data: geojson.FeatureCollection,
) -> AsyncIterable[geojson.Feature]:
    wanted = partial(want_feature, config)
    async for feature in async_filter(wanted, data["features"]):
        yield feature


def get_prop(p: Union[str, Sequence[str]]) -> Callable[[Any], Optional[Any]]:
    """
    >>> get_prop(['keys', 'wikipedia'])(
    ...    {'code': 1234, 'keys': {'wikipedia': 'this is.bingo!'}})
    'this is.bingo!'
    """
    return (
        lambda v: v.get(p)
        if isinstance(p, str)
        else reduce(lambda acc, n: acc[n] if acc and n in acc else None, p, v)
    )


def pipe(fns: Sequence[Callable[..., Any]]) -> Callable[..., Any]:
    """
    >>> def split(p: Optional[str]) -> Callable[[Optional[str]], Optional[List[str]]]:
    ...     return lambda v: str(v).split(p, 1) if v and p and len(p) >= 1 else None
    >>> def second(v: Optional[Union[List[str], Tuple[str, str]]]) -> Optional[str]:
    ...     return (str(v[1]) if v and isinstance(v, (tuple, list)) and len(v) > 0 else None)
    >>> some_input = {"code": 1234, "keys": {"wikipedia": "this is.bingo!"}}
    >>> second(
    ...     split(".")(get_prop(("keys", "wikipedia"))(some_input))
    ... ) == pipe([get_prop(["keys", "wikipedia"]), split("."), second])(some_input)
    True
    """
    return partial(reduce, lambda f, g: g(f), fns)


def mkstep(intent: Operation) -> Any:
    return intent.operation(intent.arg) if intent.arg else intent.operation


def load_script(
    script: Mapping[
        str,
        Tuple[
            Tuple[str, StorageConstraint],
            List[Union[Tuple[Callable, Any], Tuple[str]]],
        ],
    ]
) -> ScriptConfig:
    return {
        k: (Storage(*stor), [Operation(*op) for op in tuple(ops)])
        for k, (stor, ops) in script.items()
    }


# @profile
async def process(config: Config, data: Mapping[str, Any]) -> Mapping[str, Any]:
    return {
        key: pipe([mkstep(operation) for operation in operations])(data)
        for key, (_, operations) in config.script.items()
    }


async def extract_features(
    config: Config,
    filter_func: Callable[
        [Config, geojson.FeatureCollection], AsyncIterable[geojson.Feature]
    ],
    data: geojson.FeatureCollection,
) -> AsyncIterable[ExtractionProgress]:
    total = sum([1 async for f in filter_func(config, data)])
    counter = itertools.count(1).__next__
    processing = partial(process, config)
    async for raw_feature in filter_func(config, data):
        raw_record = await processing(
            {**raw_feature.get("properties"), "geometry": raw_feature.get("geometry"),},
        )
        progress = Progress(counter(), total)
        yield ExtractionProgress(progress, raw_record)


async def validate_import(db: asyncpg.Connection, table: str) -> bool:
    # test commune "Guzargues"
    start = timer()
    values = await db.fetch(f"SELECT * FROM {table} WHERE code = '34118';")
    end = timer()
    assert (end - start) < 0.1
    assert len(values) == 1
    assert values[0]["name"] == "Guzargues"

    # test arrondissement "Marseille 10e arrondissement"
    stmt = f"""\
SELECT * FROM {table}
WHERE ST_Intersects(geometry, 'SRID=4326;POINT(5.415301 43.286437)')
AND '13010'= ANY(postal) AND level = 'fr:commune';
"""
    values = await db.fetch(stmt)
    assert len(values) == 1
    assert values[0]["name"] == "Marseille 10e Arrondissement"
    return True


isatty_ = sys.stdout.isatty()
green = "\b\033[92m"
checkmark = "✓"
reset = "\033[0m"
red = "\b\033[91m"
crossmark = "❌"
clr_eol = "\033[2K\033[1G"


class TTYPrinter:
    msg_in: str
    msg_out: str
    predicate: Any

    def __init__(self, msg_in, msg_out=None):
        self.msg_in = msg_in
        self.msg_out = msg_out or self.msg_in

    def __enter__(self):
        print(self.msg_in, end=" …")
        return self

    def __exit__(self, *exc):
        if not exc[0]:
            print(f"{clr_eol}{green}{checkmark}{reset} {self.msg_out}")
            return False

        print(f"{clr_eol}{red}{crossmark}{reset} {self.msg_out}")
        return True


async def run(config) -> None:

    zones_archive = Path(Path(config.data_dir).expanduser() / config.zones_archive)
    zones_file = Path(Path(config.data_dir).expanduser() / config.zones_file)

    if not zones_file.exists():
        if not Path(config.data_dir).expanduser().exists():
            Path(config.data_dir).expanduser().mkdir(exist_ok=True)
        if not zones_archive.exists():
            with TTYPrinter(
                f"Fetching `{config.zones_archive}` from `{urlparse(config.zones_archive_url).netloc}`"
            ):
                urllib.request.urlretrieve(
                    config.zones_archive_url, zones_archive,
                )

        with TTYPrinter(
            f"Extracting `{config.zones_file}` from `{config.zones_archive}`"
        ):
            with tarfile.open(zones_archive, "r:*") as ar:

                def filter_entry(members):
                    for tarinfo in members:
                        if tarinfo.name == config.zones_file:
                            yield tarinfo

                ar.extractall(path=config.data_dir, members=filter_entry(ar))

    db = await asyncpg.connect(config.dsn)
    async with db.transaction():

        with TTYPrinter(f"Loading and parsing zones data from `{config.zones_file}`"):
            data = await load_data(str(zones_file))
            if not data:
                # FIXME
                print(
                    f"{clr_eol}{red}{crossmark}{reset} Loading and parsing zones data from `{config.zones_file}`"
                )

        print(
            f"{green}{checkmark}{reset} Selected "
            f"{sum([1 async for _ in selected_features(config, data)])} "
            f"features from a total of {len(data['features'])}"
        )

        with TTYPrinter("Configuring database connection"):
            await configure_connection(db)

        if config.drop_table:
            with TTYPrinter(f"Rebuilding table `{config.table}`"):
                await recreate_feature_table(db, config)

        collection: List[Mapping[str, Any]] = []
        async for importing in extract_features(config, selected_features, data):
            collection.append(importing.datum)
            counter, total = importing.progress
            if counter % config.batch == 0 or counter == total:
                percent = int(counter * 100 / total) if total > 0 else 0
                # print_progress = counter < total - config.batch
                msg = f"{clr_eol}Importing ({percent}%) {counter}/{total} features"
                if isatty_:
                    print(msg, end="")
                # resp = await import_feature(db, importing.feature, table=config.table)
                resp = await batch_import(db, collection, table=config.table)
                assert resp, f"COPY {config.batch}"
                collection.clear()
        msg = f"Imported ({percent}%) {counter}/{total} features"
        print(f"{clr_eol}{green}{checkmark}{reset} {msg}")

        msg = f"Create clustered index for geometries from table `{config.table}`"
        print(msg, end=" …")
        indexed = await db.execute(
            "CREATE INDEX IF NOT EXISTS geometries_idx "
            f"ON {config.table} USING GIST (geometry)"
        )
        clustered = await db.execute(f"CLUSTER {config.table} USING geometries_idx;")
        print(
            f"{clr_eol}{green + checkmark if indexed and clustered else red + crossmark}{reset} {msg}"
        )

        msg = f"Validating import to table `{config.table}`"
        print(msg, end=" …")
        valid = await validate_import(db, table=config.table)
        print(
            f"{clr_eol}{green + checkmark if valid else red + crossmark}{reset} {msg}"
        )


if __name__ == "__main__":
    # import doctest
    # doctest.testmod()

    def utf8_recode(value: str, src: str = "latin-1") -> Optional[str]:
        """
        >>> utf8_recode('ChÃ¢teau-Thierry')
        'Château-Thierry'
        >>> utf8_recode('Château-Thierry')
        'Château-Thierry'
        >>> utf8_recode(None)
        """
        if value in (None, ""):
            return None
        if "\xc3" in value:
            return value.encode(src).decode("utf-8")
        return value

    def split(p: Optional[str],) -> Callable[[Optional[str]], Optional[List[str]]]:
        """
        >>> split('.')('this is.bingo!')
        ['this is', 'bingo!']
        """
        return lambda v: str(v).split(p, 1) if v and p and len(p) >= 1 else None

    def second(v: Optional[Union[List[str], Tuple[str, str]]]) -> Optional[str]:
        """
        https://en.wikipedia.org/wiki/CAR_and_CDR … fst and snd ?
        >>> second(['this is', 'bingo!'])
        'bingo!'
        """
        return str(v[1]) if v and isinstance(v, (tuple, list)) and len(v) > 0 else None

    def concat(p: Optional[str]) -> Callable[[Optional[str]], Optional[str]]:
        """
        >>> concat('1')('a')
        '1a'
        """
        return (
            lambda v: "{}{}".format(p, v) if p and p != "" and v and v != "" else None
        )

    config = Config(
        levels=["fr:region", "fr:departement", "fr:arrondissement", "fr:commune",],
        # TODO: https://inpn.mnhn.fr/telechargement/cartes-et-information-geographique/ep/pnr
        zones_archive_url="https://www.data.gouv.fr/fr/datasets/r/eccf0cc4-c4c4-4c05-8195-2ce1374ac9f6",
        zones_archive="geozones-france-2019-0-json.tar.xz",
        zones_file="zones.json",
        data_dir="data",
        dsn="".join(
            (
                f"postgres://{os.environ.get('POSTGRES_USER', 'citizen')}",
                f":{os.environ.get('POSTGRES_PASSWORD', '')}",
                f"@{os.environ.get('POSTGRES_HOST', '127.0.0.1')}",
                f":{os.environ.get('POSTGRES_PORT', '5432')}",
                f"/{os.environ.get('POSTGRES_DB', 'citizendb')}",
            )
        ),
        table="geo_admin.admin",
        drop_table=True,
        batch=10,
        script=load_script(
            {
                # dst_key | db_type, opt db_inv | seq value(src_key), *(op, args)
                "code": (("CHARACTER VARYING", "NOT NULL"), [(get_prop, "code")],),
                "name": (
                    ("TEXT", "NOT NULL"),
                    [(get_prop, "name"), (utf8_recode, None)],
                ),
                "color": (("CHARACTER VARYING", None), [(get_prop, "color")],),
                "population": (("BIGINT", None), [(get_prop, "population")],),
                "area": (("FLOAT(6)", None), [(get_prop, "area")]),
                "level": (("GEO_ADMIN_LEVEL", "NOT NULL"), [(get_prop, "level")],),
                "blazon": (
                    ("CHARACTER VARYING", None),
                    [
                        (get_prop, "blazon"),
                        (concat, "https://commons.wikimedia.org/wiki/File:"),
                    ],
                ),
                "postal": (
                    ("CHARACTER VARYING[]", None),
                    [(get_prop, ["keys", "postal"])],
                ),
                "wikipedia": (
                    ("TEXT", None),
                    [
                        (get_prop, ["keys", "wikipedia"]),
                        (split, "."),
                        (second, None),
                        (concat, "https://fr.wikipedia.org/wiki/"),
                    ],
                ),
                "geometry": (("GEOMETRY", "NOT NULL"), [(get_prop, "geometry")],),
                "id": (("CHARACTER VARYING", "PRIMARY KEY"), [(get_prop, "id")],),
                "validity": (
                    ("CHARACTER VARYING", None),
                    [(get_prop, ["validity", "end"])],
                ),
            }
        ),
    )

    LOOP = asyncio.get_event_loop()
    try:
        LOOP.set_debug(False)
        LOOP.run_until_complete(run(config))
    finally:
        try:
            ALL_TASKS = asyncio.gather(*asyncio.all_tasks(LOOP), return_exceptions=True)
            ALL_TASKS.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                LOOP.run_until_complete(ALL_TASKS)
            LOOP.run_until_complete(LOOP.shutdown_asyncgens())
        finally:
            LOOP.close()

# Total of features:  51322
# id: fr:commune:34118@1943-01-01
# code: 34118
# name: Guzargues
# blazon: "https://commons.wikimedia.org/wiki/File:Blason_ville_fr_Guzargues_34.svg"
# population: 521
# area: 11.73
# color: #79a4d2
# wikidata: Q204558
# wikipedia: fr:Guzargues
# level: fr:commune
# keys: {
#     'insee': '34118',
#     'histo': 'COM-34118@1943-01-01',
#     'postal': ['34820'],
#     'geonames': '6432520',
#     'siren': '213401185'
# }
# validity: {'start': None, 'end': None}
# parents: [
#     'country:fr',
#     'country-group:ue',
#     'country-group:world',
#     'fr:region:76@2016-01-01',
#     'fr:departement:34@1860-07-01',
#     'fr:arrondissement:342',
#     'country-subset:fr:metro',
#     'fr:epci:200022986@2010-01-01',
#     'fr:epci:200022986@2013-01-01',
#     'fr:epci:243400793@2003-01-01',
#     'fr:epci:243400793@2004-01-01'
# ]
# Selected features:  38069

# python3 -mdoctest -v import.py
# python3 -m mccabe import.py -d | dot -Tpng -o mccabe.png
# https://radon.readthedocs.io/en/latest/intro.html#introduction-to-code-metrics
# radon mi import.py
# radon cc import.py
# radon raw import.py
# radon hal import.py
# FN="import-profile-$(date -d 'now' '+%Y%m%d%H%M%S')"; python3 -m cProfile -o "${FN}.pstats" import.py -- && gprof2dot -f pstats "${FN}.pstats" | dot -Tpng -o "${FN}.png"  # noqa: E501
# python3 -c "from pstats import Stats; Stats('import-profile-20200316110230.pstats').sort_stats('cumtime').print_stats('import', .04)"
# py-spy record -o profile.svg --nonblocking -- python3 import.py
# pyinstrument -r html import.py
# kernprof -l -v geom_import.py with @profile decorator
# python3 -m line_profiler geom_import.py.lprof
