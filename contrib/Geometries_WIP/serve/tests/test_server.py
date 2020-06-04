import json
from time import perf_counter as timer

from fr_admin_geom.server import filter_levels, get_conf, init_app

import pytest


@pytest.fixture()
async def cli(aiohttp_client):
    config = get_conf()
    return await aiohttp_client(await init_app(config))


async def test_handle(cli) -> None:
    resp = await cli.get("/")
    assert resp.status == 200
    assert await resp.text() == "Hello, Anonymous"


# @settings(suppress_health_check=[hypothesis.HealthCheck.return_value])
# @given(st.text())
async def test_handle_with_name(cli) -> None:
    name = "testing_client"
    resp = await cli.get(f"/hello/{name}")
    assert resp.status == 200
    assert await resp.text() == f"Hello, {name}"


@pytest.mark.parametrize(
    ("test_input", "expected"),
    [
        (
            ["fr:arrondissement", "fr:commune"],
            "AND level IN ('fr:arrondissement', 'fr:commune')",
        ),
        ("fr:commune", "AND level = 'fr:commune'",),
    ],
)
async def test_filter_levels_list(test_input, expected):
    assert filter_levels(test_input) == expected


async def test_handle_post_with_value(cli) -> None:
    resp = await cli.post("/", data=json.dumps({"point": "foo"}))
    assert resp.status == 200
    assert await resp.text() == "thanks for the data"
    assert cli.server.app["point"] == "foo"


async def test_geom_intersects_srid0(cli) -> None:
    start = timer()
    resp = await cli.post(
        "/intersects",
        data=json.dumps(
            {
                "geom": "POINT(5.415301 43.286437)",
                "levels": ["fr:arrondissement", "fr:commune"],
            }
        ),
    )
    end = timer()
    content = await resp.json()
    assert end - start < 0.4
    assert resp.status == 200
    assert len(content) == 3

    for result, expected in zip(
        content,
        [
            (("name", "Marseille"), ("level", "fr:arrondissement")),
            (("name", "Marseille"), ("level", "fr:commune")),
            (
                ("name", "Marseille 10e Arrondissement"),
                ("level", "fr:commune"),
            ),
        ],
    ):
        props = result.get("properties")
        for name, val in expected:
            assert props[name] == val


async def test_geom_intersects_srid4326(cli) -> None:
    start = timer()
    resp = await cli.post(
        "/intersects",
        data=json.dumps(
            {
                "geom": "SRID=4326;POINT(5.415301 43.286437)",
                "levels": ["fr:arrondissement", "fr:commune"],
            }
        ),
    )
    content = await resp.json()
    end = timer()
    assert end - start < 0.4
    assert resp.status == 200
    assert len(content) == 3

    for result, expected in zip(
        content,
        [
            (("name", "Marseille"), ("level", "fr:arrondissement")),
            (("name", "Marseille"), ("level", "fr:commune")),
            (
                ("name", "Marseille 10e Arrondissement"),
                ("level", "fr:commune"),
            ),
        ],
    ):
        props = result.get("properties")
        for name, val in expected:
            assert props[name] == val


async def test_geom_intersects_srid3857(cli) -> None:
    start = timer()
    resp = await cli.post(
        "/intersects",
        data=json.dumps(
            {
                "geom": "SRID=3857;POINT(602828.549812304 5355672.60478097)",
                "levels": ["fr:arrondissement", "fr:commune"],
            }
        ),
    )
    content = await resp.json()
    end = timer()
    assert end - start < 0.4
    assert resp.status == 200
    assert len(content) == 3

    for result, expected in zip(
        content,
        [
            (("name", "Marseille"), ("level", "fr:arrondissement")),
            (("name", "Marseille"), ("level", "fr:commune")),
            (
                ("name", "Marseille 10e Arrondissement"),
                ("level", "fr:commune"),
            ),
        ],
    ):
        props = result.get("properties")
        for name, val in expected:
            assert props[name] == val


async def test_handle_geom_intersect_badpoint(cli) -> None:
    start = timer()
    resp = await cli.post(
        "/intersects",
        data=json.dumps(
            {
                "geom": "POINT(-71.064544, 42.28787)",
                "levels": ["fr:arrondissement", "fr:commune"],
            }
        ),
    )
    end = timer()
    assert end - start < 0.4
    assert resp.status == 400
    assert resp.reason == "Bad Request"
    assert "invalid geometry" in await resp.text()
