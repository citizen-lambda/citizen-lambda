from typing import Type, Optional


from gncitizen.utils import (
    ReadRepoAdapter,
    AdapterCollection,
    ReadRepository,
    # RWRepository
)
from gncitizen.core.taxonomy.taxon import Taxon

TaxonRepository = ReadRepository[Taxon]
# TODO: considering gunicorn workers: test with flask.app['taxonomy'] = TAXA binding
TAXA: Optional[TaxonRepository] = None
TAXA_READ_REPO_ADAPTERS: AdapterCollection[
    Taxon
] = AdapterCollection()


def set_default_read_adapter(
    adapter: Optional[Type[ReadRepoAdapter]] = None
) -> ReadRepoAdapter:
    adapter_types = TAXA_READ_REPO_ADAPTERS.get()
    if len(adapter_types) <= 0:
        raise Exception("No registered adapter.")
    if adapter and adapter.name not in adapter_types:
        raise Exception(f"Unregistered adapter {adapter.name}.")
    if not adapter:
        _adapter = adapter_types.get(list(adapter_types)[0])
    read_repo_adapter: Type[ReadRepoAdapter] = adapter_types[_adapter.name]
    return read_repo_adapter()


def setup_taxon_repo(
    # reading_head ?
    adapter: Optional[ReadRepoAdapter[Taxon]] = None,
    # write_repo: Optional[WriteRepoAdapter[Taxon]]
):
    global TAXA

    if (adapter is not None and TAXA is not None):
        TAXA.read_adapter = adapter
    if (adapter is not None and TAXA is None):
        TAXA = TaxonRepository(adapter)
    else:
        try:
            adapter = set_default_read_adapter()
            TAXA = TaxonRepository(adapter)
        except Exception:
            # No surrogate repository could be found
            raise

    # if TAXA is not None:
    #     _t: Optional[Taxon] = TAXA.get(61153)
    #     if _t:
    #         _m = [dataclasses.asdict(medium) for medium in _t.media]
    #         print(f"test: {_t}")
    #         print(f"test: {type(_t.media)}")
    #         print(f"test: {_m}")
    #     else:
    #         print('NO TAXON')
    # else:
    #     print('Empty TAXA repo')


setup_default_repo = setup_taxon_repo
