from typing import Any, TypeVar


T = TypeVar("T")


class ReadRepo:
    def __init__(self, adapter):
        self.adapter = adapter

    def get(self, ref: Any) -> T:
        return self.adapter.get(ref)

    # def resolve(self, prop: str, value: Any) -> Iterable[T]:
    #     ...


class WriteRepo:
    def __init__(self, adapter):
        self.adapter = adapter

    def upsert(self, item: T, payload: Any):
        self.adapter.upsert(item, payload)


class TaxaRepo:

    def __init__(
        self,
        read_repo: ReadRepo,
        # write_repo: WriteRepo
    ):
        self.read_repo = read_repo
        # self.write_repo = write_repo

    def get(self, item):
        return self.read_repo.get(item)

    # def resolve(self, prop, value):
    #     return self.read_repo.resolve(prop, value)

    # def upsert(self, item, payload):
    #     if isinstance(item, int):
    #         taxon = self.get(item)
    #     elif isinstance(item, Taxon):
    #         taxon = item
    #     return self.write_repo.upsert(taxon, payload)


if __name__ == "__main__":
    from gncitizen.core.taxonomy.taxref_adapter import MnhnTaxRefRestAdapter

    read_repo_adapter = MnhnTaxRefRestAdapter()
    read_repo = ReadRepo(read_repo_adapter)
    print(read_repo.get(61153))
