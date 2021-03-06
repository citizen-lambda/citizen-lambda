from typing import Dict, Type, Optional, cast


from gncitizen.utils import (
    ReadRepoAdapter,
    AdapterCollection,
    ReadRepository,
)
from gncitizen.core.taxonomy.taxon import Taxon

TaxonRepository = ReadRepository[Taxon]
# TODO: considering gunicorn workers: test with flask.app['taxonomy'] = TAXA binding
TAXA: Optional[TaxonRepository] = None
TAXON_REPO_ADAPTERS: AdapterCollection[Taxon] = AdapterCollection()


def set_default_read_adapter(
    adapter: Optional[Type[ReadRepoAdapter[Taxon]]] = None,
) -> ReadRepoAdapter[Taxon]:
    adapter_types: Dict[
        str, Type[ReadRepoAdapter[Taxon]]
    ] = TAXON_REPO_ADAPTERS.get()
    if len(adapter_types) < 1:
        raise Exception("No registered adapter.")
    if adapter and adapter.name not in adapter_types:
        raise Exception(f"Unregistered adapter {adapter.name}.")
    if adapter is None:
        _adapter: Type[ReadRepoAdapter[Taxon]] = cast(
            Type[ReadRepoAdapter[Taxon]],  # non Optional
            adapter_types.get(list(adapter_types)[0]),
        )
    read_repo_adapter: Type[ReadRepoAdapter[Taxon]] = adapter_types[
        _adapter.name
    ]
    return read_repo_adapter()


def setup_taxon_repo(adapter: Optional[ReadRepoAdapter[Taxon]] = None):
    global TAXA

    if adapter is not None and TAXA is not None:
        TAXA.read_adapter = adapter
    if adapter is not None and TAXA is None:
        TAXA = TaxonRepository(adapter)
    else:
        try:
            adapter = set_default_read_adapter()
            TAXA = TaxonRepository(adapter)
        except Exception:
            print("No surrogate repository could be found")
            raise


setup_default_repo = setup_taxon_repo
