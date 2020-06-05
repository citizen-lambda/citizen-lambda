import datetime
import re
from collections import OrderedDict
from typing import Optional

from gncitizen.utils.env import now

try:
    from flask import current_app

    conf = current_app.config["REWARDS"]["CONF"]
    logger = current_app.logger
except RuntimeError as e:
    import logging

    logger = logging.getLogger()
    if str(e.args[0]).startswith("Working outside of application context.\n"):
        conf = {
            "attendance": {"Au": 348, "Ar": 347, "CuSn": 345},
            "seniority": {
                "oeuf": "1month",
                "chenille": "6months",
                "papillon": "7 months",
            },
            "program_attendance": {"Au": 64, "Ar": 48, "CuSn": 46},
            "program_date_bounds": {"start": "2019-03-20", "end": ""},
            "recognition": [
                {
                    "class": "Aves",
                    "specialization": "Ornitologue",
                    "attendance": {"Au": 110, "Ar": 109, "CuSn": 10},
                },
                {
                    "class": "Mammalia",
                    "specialization": "Mammalogiste",
                    "attendance": {"Au": 500, "Ar": 94, "CuSn": 7},
                },
                {
                    "class": "Reptilia",
                    "specialization": "Herpétologue",
                    "attendance": {"Au": 500, "Ar": 100, "CuSn": 10},
                },
                {
                    "order": "Odonata",
                    "specialization": "Odonatologue",
                    "attendance": {"Au": 500, "Ar": 100, "CuSn": 10},
                },
                {
                    "order": "Lepidoptera",
                    "specialization": "Lépidoptériste",
                    "attendance": {"Au": 500, "Ar": 100, "CuSn": 10},
                },
            ],
        }
    else:
        raise

Timestamp = float


def config_duration2timestamp(s: Optional[str]) -> Optional[Timestamp]:
    """
    >>> datetime.date.fromtimestamp(config_duration2timestamp("3 months")) == (now() - datetime.timedelta(weeks=3 * 4.345)).date()
    True
    >>> datetime.date.fromtimestamp(config_duration2timestamp("28days")) == (now() - datetime.timedelta(days=28)).date()
    True
    >>> datetime.date.fromtimestamp(config_duration2timestamp("1year")) == (now() - datetime.timedelta(weeks=52.143)).date()
    True
    >>> config_duration2timestamp("52elephants") is None
    True
    >>> config_duration2timestamp("1969 08 18") == datetime.datetime.strptime("1969-08-18", "%Y-%m-%d").timestamp()
    True
    """  # noqa: E501
    if s is None or s == "":
        return now().timestamp()

    # int hours -> years
    dt = None
    weeks_in_month = 4.345
    weeks_in_year = 52.143
    units = [
        ("HOURS", r"hours?|heures?"),
        ("DAYS", r"days?|jours?"),
        ("WEEKS", r"weeks?|semaines?"),
        ("MONTHS", r"months?|mois"),
        ("YEARS", r"years?|ans?"),
    ]
    tok_regex = "".join(
        [
            r"(?P<QUANTITY>\d+)\s*(",
            "|".join("(?P<%s>%s)" % pair for pair in units),
            r")",
        ]
    )
    for mo in re.finditer(tok_regex, s):
        value = mo.group("QUANTITY")
        if mo.group("HOURS"):
            dt = datetime.timedelta(hours=float(value))
        if mo.group("DAYS"):
            dt = datetime.timedelta(days=float(value))
        if mo.group("WEEKS"):
            dt = datetime.timedelta(weeks=float(value))
        if mo.group("MONTHS"):
            dt = datetime.timedelta(weeks=float(value) * weeks_in_month)
        if mo.group("YEARS"):
            dt = datetime.timedelta(weeks=float(value) * weeks_in_year)

    if dt:
        return (now() - dt).timestamp()
    try:
        y, m, d, *_rest = map(int, re.findall(r"\d+", str(s)))
        return datetime.datetime(y, m, d).timestamp()
    except Exception as e:
        logger.critical(e)
        return None


attendance_model = OrderedDict(
    reversed(sorted(conf["attendance"].items(), key=lambda t: t[1]))
)

seniority_model = OrderedDict(
    reversed(
        sorted(
            [(k, config_duration2timestamp(v)) for k, v in conf["seniority"].items()],
            key=lambda t: t[1],
        )
    )
)

program_attendance_model = OrderedDict(
    reversed(sorted(conf["program_attendance"].items(), key=lambda t: t[1]))
)

program_date_bounds_model = {
    "start": config_duration2timestamp(conf["program_date_bounds"]["start"]),
    "end": config_duration2timestamp(conf["program_date_bounds"]["end"]),
}

recognition_model = [
    {
        "class"
        if "class" in conf["recognition"][i]
        else "order": conf["recognition"][i]["class"]
        if "class" in conf["recognition"][i]
        else conf["recognition"][i]["order"],
        "specialization": conf["recognition"][i]["specialization"],
        "attendance": OrderedDict(
            reversed(
                sorted(
                    conf["recognition"][i]["attendance"].items(), key=lambda t: t[1],
                )
            )
        ),
    }
    for i in range(len(conf["recognition"]))
]


if __name__ == "__main__":
    import doctest

    doctest.testmod(verbose=True)
