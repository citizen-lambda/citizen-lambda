#!/usr/bin/env python3
from warnings import warn
from typing import (
    Iterable,
    Optional,
    TypeVar,
    Callable,
    Union,
    Mapping,
    Any,
    Sequence,
    Dict,
    Generic,
    Type,
)
from functools import reduce
from urllib.parse import urlparse
import json

import requests


K = TypeVar("K", str, int)
V = TypeVar("V", Mapping, int, str)
T = TypeVar("T")


def compose(*fns):
    return reduce(lambda f, g: lambda x: f(g(x)), fns, lambda x: x)  # noqa


def pass_through(k):
    def _inner_passthrough(v):
        # print(f"k:{k} v:{v}")
        return v

    return _inner_passthrough


def extractor(data: Mapping) -> Callable:
    def _str_extract(nodes: Sequence[str]) -> str:
        return path_str(nodes, data)

    return _str_extract


# alignment
transformer = pass_through


def mapper(
    transformer: Callable, extractor: Callable, extractions: Dict, data: Mapping[K, V]
) -> Iterable[V]:
    return [compose(transformer(k), extractor(data))(v) for k, v in extractions.items()]


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


def _path(mapping: Mapping[K, V]) -> Callable:
    # https://github.com/microsoft/python-language-server/issues/121
    # split annotation and definition on nonlocal variable
    m: Any
    m = mapping

    def path_val(nodes: Sequence[K]) -> Optional[V]:
        nonlocal m
        head: Union[K, int, str]
        tail: Sequence[Union[K, int, str]]
        if (
            all(hasattr(m, attr) for attr in {"keys", "__getitem__"})
            and len(nodes) >= 1
        ):
            head, *tail = nodes
            m = m.get(head)
            return path_val(tail)
        else:
            return m

    return path_val


# TODO: pick + strategy


def path_str(nodes: Sequence[str], mapping: Mapping[str, V]) -> str:
    """Traverse the map following the nodes path
    and return the value of the terminal node
    >>> path_str(["A", "B", "Z"], {"A": {"B": {"C": "bingo"}}})
    ''
    >>> path_str(["A", "B", "C"], {"A": {"B": {"C": "bingo"}}})
    'bingo'
    """
    r = _path(mapping)(nodes)
    return str(r) if r else ""


def path_url(nodes: Sequence[str], mapping: Mapping[str, str]) -> str:
    if not mapping or not nodes:
        return ""
    link = path_str(nodes, mapping)
    return parsed_url(link) if is_url(link) else ""


class ReadRepoAdapter(Generic[T]):
    name: str
    provides: str

    def get(self, *args: Any, **kwargs: Any) -> Optional[T]:
        ...


class WriteRepoAdapter(Generic[T]):
    name: str
    provides: str

    def upsert(self, item: T, payload: Any):
        ...


class ReadRepository(Generic[T]):
    read_adapter: Union[ReadRepoAdapter[T], Any]

    def __init__(self, read_adapter: ReadRepoAdapter[T], *args, **kwargs):
        self.read_adapter = read_adapter

    def get(self, ref: Any) -> Optional[T]:
        return self.read_adapter.get(ref)

    # def resolve(self, prop: str, match: Any) -> Iterable[T]:
    #     todo: merge with accessor
    #     ...


class WriteRepository(Generic[T]):
    write_adapter: Union[WriteRepoAdapter[T], Any]

    def __init__(self, write_adapter: WriteRepoAdapter[T], *args, **kwargs):
        self.write_adapter = write_adapter

    def upsert(self, item: T, payload: Any):
        return self.write_adapter.upsert(item, payload)


class RWRepository(ReadRepository, WriteRepository, Generic[T]):
    def __init__(
        self, read_adapter: ReadRepoAdapter[T], write_adapter: WriteRepoAdapter[T]
    ):
        self.read_adapter = read_adapter
        self.write_adapter = write_adapter


Repository = Union[ReadRepository[T], WriteRepository[T], RWRepository[T]]
RepoAdapter = Union[ReadRepoAdapter[T], WriteRepoAdapter[T]]


class AdapterCollection(Generic[T]):
    def __init__(self):
        self._adapters: Dict[str, Type[RepoAdapter[T]]] = dict()

    def register(self, adapter: Type[RepoAdapter[T]]):
        self._adapters.update({adapter.name: adapter})

    def get(self):
        return self._adapters


class HttpProxy:
    # TODO: handle eventual post & auth
    def call(
        self, link: str, defaultvalue: Optional[V] = None
    ) -> Union[Optional[Mapping[Any, Any]], Optional[V]]:
        url = parsed_url(link)
        r = requests.get(url)
        try:
            r.raise_for_status()
            return r.json()
        except (
            requests.exceptions.HTTPError,
            json.decoder.JSONDecodeError,
            ValueError,
        ) as e:
            warn(str(e))
            return defaultvalue


if __name__ == "__main__":
    import doctest

    doctest.testmod(verbose=True)
