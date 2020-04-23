# import requests
from flask import Blueprint, current_app
from gncitizen.utils.env import db


if current_app.config.get("API_TAXHUB") is not None:
    from gncitizen.core.taxonomy.models import (
        BibNoms,
        BibListes,
        CorNomListe,
        TMedias,
        Taxref,
    )
else:
    from gncitizen.utils.taxonomy import mk_taxon_repository


routes = Blueprint("taxonomy", __name__)


@routes.route("/taxonomy/lists", methods=["GET"])
def get_lists():
    """Renvoie toutes liste d'espèces
    GET
        ---
        tags:
            - TaxHub api
        definitions:
            id_liste:
                type: integer
            nb_taxons:
                type: integer
            desc_liste:
                type: string
            picto:
                type: string
            group2inpn:
                type: string
            nom_liste:
                type: string
            regne:
                type: string
        responses:
            200:
                description: A list of all species lists
        """
    try:
        data = BibListes.query.all()
        # current_app.logger.debug([l.as_dict() for l in data])
        return [l.as_dict() for l in data]
    except Exception as e:
        return {"message": str(e)}, 400


@routes.route("/taxonomy/lists/<int:id_>/species", methods=["GET"])
def get_list(id_):
    """Renvoie une liste d'espèces spécifiée par son id
    GET
        ---
        tags:
            - TaxHub api
        definitions:
            id_liste:
                type: integer
            nb_taxons:
                type: integer
            desc_liste:
                type: string
            picto:
                type: string
            group2inpn:
                type: string
            nom_liste:
                type: string
            regne:
                type: string
            responses:
            200:
                description: A list of all species lists
        """

    if current_app.config.get("API_TAXHUB") is None:
        current_app.logger.info("Calling TaxRef REST API.")
        return mk_taxon_repository(id)

    current_app.logger.info("Select TaxHub schema.")
    try:
        data = (
            db.session.query(BibNoms, Taxref, TMedias)
            .distinct(BibNoms.cd_ref)
            .join(CorNomListe, CorNomListe.id_nom == BibNoms.id_nom)
            .join(Taxref, Taxref.cd_ref == BibNoms.cd_ref)
            .outerjoin(TMedias, TMedias.cd_ref == BibNoms.cd_ref)
            .filter(CorNomListe.id_liste == id_)
            .all()
        )
        return [
            {
                "nom": d[0].as_dict(),
                "taxref": d[1].as_dict(),
                "media": d[2].as_dict() if d[2] else None,
            }
            for d in data
        ]
    except Exception as e:
        return {"message": str(e)}, 400


@routes.route("/taxonomy/taxon/<int:cd_nom>", methods=["GET"])
def get_taxon_from_cd_nom(cd_nom):
    """Get taxon TaxRef data from cd_nom
        ---
        tags:
            - taxon
        parameters:
            - name: cd_nom
                in: path
                type: integer
                required: true
                example: 1
        definitions:
            cd_nom:
                type: integer
                description: cd_nom from TaxRef
        responses:
            200:
                description: Taxon data from Taxref
    """
    from gncitizen.core.taxonomy.models import (  # noqa: E501  pylint: disable=import-outside-toplevel
        Taxref,
    )

    taxon = Taxref.query.filter_by(cd_nom=cd_nom).first()
    return taxon.as_dict(True)
