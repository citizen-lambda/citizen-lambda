from typing import Type, Optional
import dataclasses

from gncitizen.utils import (
    ReadRepoProxy,
    ReadRepoAdapter,
    AdapterCollection,
    ReadRepository,
    # RWRepository
)
from gncitizen.core.taxonomy.taxon import Taxon

TaxonRepository = ReadRepository[Taxon]
TAXA: Optional[TaxonRepository] = None
TAXA_READ_REPO_ADAPTERS: AdapterCollection[
    Taxon
] = AdapterCollection()


def read_repo_factory(
    adapter: Optional[Type[ReadRepoAdapter]] = None
) -> ReadRepoProxy:
    adapter_types = TAXA_READ_REPO_ADAPTERS.get()
    if not len(adapter_types) > 0:
        raise Exception("No registered adapter.")
    elif adapter and adapter not in adapter_types:
        raise Exception(f"Could not find adapter {adapter} in registry.")
    elif not adapter:
        adapter = adapter_types[0]
    read_repo_adapter: Type[ReadRepoAdapter] = adapter_types[
        adapter_types.index(adapter)
    ]
    return ReadRepoProxy(read_repo_adapter())


def setup_taxon_repo(
    read_repo: Optional[ReadRepoProxy[Taxon]] = None,
    # write_repo: Optional[WriteRepoProxy[Taxon]]
):
    global TAXA

    if (read_repo is not None and TAXA is not None):
        TAXA.read_repo = read_repo
    if (read_repo is not None and TAXA is None):
        TAXA = TaxonRepository(read_repo)
    else:
        try:
            read_repo = read_repo_factory()
            TAXA = TaxonRepository(read_repo)
        except Exception:
            # No surrogate repository could be found
            raise

    if TAXA is not None:
        _t: Optional[Taxon] = TAXA.get(61153)
        if _t:
            _m = [dataclasses.asdict(medium) for medium in _t.media]
            print(f"test: {_t}")
            print(f"test: {type(_t.media)}")
            print(f"test: {_m}")
        else:
            print('NO TAXON')
    else:
        print('Empty TAXA repo')


setup_default_repo = setup_taxon_repo
