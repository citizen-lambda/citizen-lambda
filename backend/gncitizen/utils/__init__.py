#!/usr/bin/env python3
from typing import (Iterable, Optional, TypeVar, Callable,
                    Mapping, Any, Sequence, Dict)
from functools import reduce
from urllib.parse import urlparse


K = TypeVar("K")
V = TypeVar("V")


def compose(*fns):
    return reduce(lambda f, g: lambda x: f(g(x)), fns, lambda x: x)  # noqa


def transformer(k):
    def _dummy_transform(v):
        # print(f"k:{k} v:{v}")
        return v
    return _dummy_transform


def extractor(data: Mapping) -> Callable:
    def _str_extract(nodes: Sequence[str]) -> str:
        return pick_str(nodes, data)
    return _str_extract


def mapper(
    transformer: Callable,
    extractor: Callable,
    extractions: Dict,
    data: Mapping[K, V]
) -> Iterable[V]:
    return [
        compose(transformer(k), extractor(data))(v)
        for k, v in extractions.items()
    ]


def is_url(link="") -> bool:
    try:
        url = urlparse(link)
        return len(url.netloc) > 1
    except ValueError:
        return False


def parsed_url(link="") -> str:
    try:
        url = urlparse(link)
        return url.geturl()
    except ValueError:
        return ""


def _pick(mapping: Mapping[K, V]) -> Callable:
    # https://github.com/microsoft/python-language-server/issues/121
    # split annotation and definition on nonlocal variable
    m: Any
    m = mapping

    def pick_val(nodes: Sequence[K]) -> Optional[V]:
        nonlocal m
        if (all(hasattr(m, attr) for attr in {'keys', '__getitem__'})
                and len(nodes) >= 1):
            head, *tail = nodes
            m = m.get(head)
            return pick_val(tail)
        else:
            return m

    return pick_val


def pick_str(
    nodes: Sequence[str],
    mapping: Mapping[str, V]
) -> str:
    """Traverse the map following the nodes path
    and return the value of the terminal node
    >>> pick_str(["A", "B", "Z"], {"A": {"B": {"C": "bingo"}}})
    ''
    >>> pick_str(["A", "B", "C"], {"A": {"B": {"C": "bingo"}}})
    'bingo'
    """
    r = _pick(mapping)(nodes)
    return str(r) if r else ""


def pick_url(
    nodes: Sequence[str], mapping: Mapping[str, str]
) -> str:
    if not mapping or not nodes:
        return ""
    link = pick_str(nodes, mapping)
    return parsed_url(link) if is_url(link) else ""


if __name__ == "__main__":
    import doctest

    doctest.testmod(verbose=True)
