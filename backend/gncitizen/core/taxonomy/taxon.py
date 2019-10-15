from typing import Iterable


class Taxon:
    def __init__(
        self,
        cd_nom,  # id
        cd_ref,  # referenceId
        cd_sup,  # parentId
        nom_valide,  # scientificName,
        lb_auteur,  # authority,
        # fullName,
        # fullNameHtml,
        id_rang,  # rankId,
        # rankName,
        nom_complet,  # referenceName,
        nom_complet_html,  # referenceNameHtml,
        nom_vern,  # frenchVernacularName,
        nom_vern_eng,  # englishVernacularName,
        # genusName,
        famille,  # familyName,
        ordre,  # orderName,
        classe,  # className,
        phylum,  # phylumName,
        regne,  # kingdomName,
        # vernacularGenusName,
        # vernacularFamilyName,
        # vernacularOrderName,
        # vernacularClassName,
        # vernacularPhylumName,
        # vernacularKingdomName,
        group1_inpn,  # vernacularGroup1,
        group2_inpn,  # vernacularGroup2,
        id_habitat,  # habitat,
        id_statut,  # fr,
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
        media,
    ):
        self.cd_nom = cd_nom
        self.cd_ref = cd_ref
        self.cd_sup = cd_sup
        self.nom_valide = nom_valide
        self.lb_auteur = lb_auteur
        # self.fullName = fullName
        # self.fullNameHtml = fullNameHtml
        self.id_rang = id_rang
        # self.rankName = rankName
        self.nom_complet = nom_complet
        self.nom_complet_html = nom_complet_html
        self.nom_vern = nom_vern
        self.nom_vern_eng = nom_vern_eng
        # self.genusName = genusName
        self.famille = famille
        self.ordre = ordre
        self.classe = classe
        self.phylum = phylum
        self.regne = regne
        # self.vernacularGenusName = vernacularGenusName
        # self.vernacularFamilyName = vernacularFamilyName
        # self.vernacularOrderName = vernacularOrderName
        # self.vernacularClassName = vernacularClassName
        # self.vernacularPhylumName = vernacularPhylumName
        # self.vernacularKingdomName = vernacularKingdomName
        # self.vernacularGroup1 = vernacularGroup1
        # self.vernacularGroup2 = vernacularGroup2
        self.id_habitat = id_habitat
        self.id_statut = id_statut
        # self.gf = gf
        # self.mar = mar
        # self.gua = gua
        # self.sm = sm
        # self.sb = sb
        # self.spm = spm
        # self.may = may
        # self.epa = epa
        # self.reu = reu
        # self.sa = sa
        # self.ta = ta
        # self.nc = nc
        # self.wf = wf
        # self.pf = pf
        # self.cli = cli
        # self.taxrefVersion = taxrefVersion
        self.media = media

    def __repr__(self):
        return f"""<Taxon {self.cd_nom} "{self.nom_valide}" "{self.nom_vern}">"""  # noqa: E501

    __str__ = __repr__


class TaxonMedium:
    def __init__(
        self,
        cd_ref,
        url,
        titre="",
        licence="",
        source="",
        id_type="",
        thumb_url="",
    ):
        self.cd_ref = cd_ref
        self.url = url
        self.titre = titre
        self.licence = licence
        self.source = source
        self.id_type = id_type
        self.thumb_url = thumb_url

    def __repr__(self):
        return f"<TaxonMedium {self.cd_ref} {self.id_type} {self.url}>"

    __str__ = __repr__


TaxonMedia = Iterable[TaxonMedium]
