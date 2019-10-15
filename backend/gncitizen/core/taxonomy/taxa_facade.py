from typing import Any, TypeVar, Iterable


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


class Taxon:
    def __init__(
        self,
        referenceId,
        parentId,
        scientificName,
        authority,
        fullName,
        fullNameHtml="",
        rankId="",
        rankName="",
        referenceName="",
        referenceNameHtml="",
        frenchVernacularName="",
        englishVernacularName="",
        genusName="",
        familyName="",
        orderName="",
        className="",
        phylumName="",
        kingdomName="",
        vernacularGenusName="",
        vernacularFamilyName="",
        vernacularOrderName="",
        vernacularClassName="",
        vernacularPhylumName="",
        vernacularKingdomName="",
        vernacularGroup1="",
        vernacularGroup2="",
        habitat="",
        fr="",
        gf="",
        mar="",
        gua="",
        sm="",
        sb="",
        spm="",
        may="",
        epa="",
        reu="",
        sa="",
        ta="",
        nc="",
        wf="",
        pf="",
        cli="",
        taxrefVersion="",
        media=[],
    ):
        self.referenceId = referenceId
        self.parentId = parentId
        self.scientificName = scientificName
        self.authority = authority
        self.fullName = fullName
        self.fullNameHtml = fullNameHtml
        self.rankId = rankId
        self.rankName = rankName
        self.referenceName = referenceName
        self.referenceNameHtml = referenceNameHtml
        self.frenchVernacularName = frenchVernacularName
        self.englishVernacularName = englishVernacularName
        self.genusName = genusName
        self.familyName = familyName
        self.orderName = orderName
        self.className = className
        self.phylumName = phylumName
        self.kingdomName = kingdomName
        self.vernacularGenusName = vernacularGenusName
        self.vernacularFamilyName = vernacularFamilyName
        self.vernacularOrderName = vernacularOrderName
        self.vernacularClassName = vernacularClassName
        self.vernacularPhylumName = vernacularPhylumName
        self.vernacularKingdomName = vernacularKingdomName
        self.vernacularGroup1 = vernacularGroup1
        self.vernacularGroup2 = vernacularGroup2
        self.habitat = habitat
        self.fr = fr
        self.gf = gf
        self.mar = mar
        self.gua = gua
        self.sm = sm
        self.sb = sb
        self.spm = spm
        self.may = may
        self.epa = epa
        self.reu = reu
        self.sa = sa
        self.ta = ta
        self.nc = nc
        self.wf = wf
        self.pf = pf
        self.cli = cli
        self.taxrefVersion = taxrefVersion
        self.media = media

    def __repr__(self):
        return f"""<Taxon {self.referenceId} {self.fullName} {self.frenchVernacularName}>"""  # noqa: E501

    __str__ = __repr__


class TaxonMedium:
    def __init__(
        self,
        referenceId,
        url,
        title="",
        licence="",
        copyright="",
        mime="",
        thumb_url="",
    ):
        self.referenceId = referenceId
        self.url = url
        self.title = title
        self.licence = licence
        self.copyright = copyright
        self.mime = mime
        self.thumb_url = thumb_url

    def __repr__(self):
        return f"<TaxonMedium {self.referenceId} {self.mime} {self.url}>"

    __str__ = __repr__


TaxonMedia = Iterable[TaxonMedium]


if __name__ == "__main__":
    from gncitizen.core.taxonomy.taxref_adapter import MnhnTaxRefRestAdapter

    read_repo_adapter = MnhnTaxRefRestAdapter()
    read_repo = ReadRepo(read_repo_adapter)
    print(read_repo.get(61153))
