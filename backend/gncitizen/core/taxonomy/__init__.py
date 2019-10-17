from typing import Type
from gncitizen.utils import (
    ReadRepoProxy,
    ReadRepoAdapter,
    ReadRepoAdapterRegistration,
)
from gncitizen.core.taxonomy.taxon import Taxon


class TaxaRepo:

    def __init__(
        self,
        read_repo: ReadRepoProxy[Taxon],
        # write_repo: WriteRepo[Taxon]
    ):
        self.read_repo = read_repo
        # self.write_repo = write_repo

    def get(self, item):
        return self.read_repo.get(item)

    # def resolve(self, prop, matching):
    #     todo: merge with accessor
    #     return self.read_repo.resolve(prop, matching)

    # def upsert(self, item, payload):
    #     if isinstance(item, int):
    #         ref = self.get(item)
    #     elif isinstance(item, Taxon):
    #         ref = item.id
    #     return self.write_repo.upsert(ref, payload)


TAXA_READ_REPO_ADAPTERS: ReadRepoAdapterRegistration[Taxon] = ReadRepoAdapterRegistration()  # noqa: E501


def read_repo_factory(adapter: Type[ReadRepoAdapter]):
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


def setup_default_repo(
    read_repo: ReadRepoProxy,
    # write_repo: WriteRepoProxy
):
    global TAXA
    if read_repo is None:
        raise Exception("No surrogate repository could be found.")
    TAXA = TaxaRepo(read_repo)
    # print(f"test: {str(TAXA.get(61153))}")


TAXA = None
