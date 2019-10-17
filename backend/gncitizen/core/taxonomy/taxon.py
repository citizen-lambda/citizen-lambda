from typing import List
from dataclasses import dataclass, field


@dataclass
class TaxonMedium:
    cd_nom: int
    cd_ref: int
    url: str = ""
    titre: str = ""
    licence: str = ""
    source: str = ""
    id_type: int = 2
    thumb_url: str = ""

    def __repr__(self):
        return f"<TaxonMedium {self.cd_ref} {self.id_type} {self.url}>"

    __str__ = __repr__


TaxonMedia = List[TaxonMedium]


@dataclass
class Taxon:
    cd_nom: int   # id
    cd_ref: int  # referenceId
    cd_sup: int  # parentId
    nom_valide: str  # scientificName,
    lb_auteur: str  # authority,
    # fullName,
    # fullNameHtml,
    id_rang: int  # rankId,
    # rankName,
    nom_complet: str  # referenceName,
    nom_complet_html: str  # referenceNameHtml,
    nom_vern: str  # frenchVernacularName,
    nom_vern_eng: str  # englishVernacularName,
    # genusName,
    famille: str  # familyName,
    ordre: str  # orderName,
    classe: str  # className,
    phylum: str  # phylumName,
    regne: str  # kingdomName,
    # vernacularGenusName,
    # vernacularFamilyName,
    # vernacularOrderName,
    # vernacularClassName,
    # vernacularPhylumName,
    # vernacularKingdomName,
    group1_inpn: str  # vernacularGroup1,
    group2_inpn: str  # vernacularGroup2,
    id_habitat: int  # habitat,
    id_statut: int  # fr,
    # gf,
    # mar,
    # gua,
    # sm,
    # sb,
    # spm,
    # may,
    # epa,
    # reu,
    # sa,
    # ta,
    # nc,
    # wf,
    # pf,
    # cli,
    # taxrefVersion,
    media: TaxonMedia = field(default_factory=list)

    def __repr__(self):
        return f"""<Taxon {self.cd_nom} "{self.nom_valide}" "{self.nom_vern}">"""  # noqa: E501

    __str__ = __repr__
