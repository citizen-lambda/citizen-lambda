from typing import Type, Optional

from gncitizen.utils import (
    ReadRepoProxy,
    ReadRepoAdapter,
    ReadRepoAdapterRegistration,
    ReadRepository,
    # RWRepository
)
from gncitizen.core.taxonomy.taxon import Taxon

TaxonRepository = ReadRepository[Taxon]
TAXA: Optional[TaxonRepository] = None
TAXA_READ_REPO_ADAPTERS: ReadRepoAdapterRegistration[
    Taxon
] = ReadRepoAdapterRegistration()


def read_repo_factory(adapter: Optional[Type[ReadRepoAdapter]] = None):
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
    if (read_repo is None and TAXA is None):
        try:
            read_repo = read_repo_factory()
            TAXA = TaxonRepository(read_repo)
        except Exception:
            # ("No surrogate repository could be found.")
            raise
    # print(f"test: {str(TAXA.get(61153))}")


setup_default_repo = setup_taxon_repo
