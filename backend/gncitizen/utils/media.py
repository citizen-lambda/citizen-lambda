#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""A module to manage media"""

import os

from flask import current_app

from gncitizen.core.commons.models import MediaModel
from gncitizen.utils.env import MEDIA_DIR, ALLOWED_EXTENSIONS, db, now
from gncitizen.utils.errors import GeonatureApiError


def allowed_file(filename):
    """Check if uploaded file type is allowed

    :param filename: file name
    :type filename: str

    :return: boolean value, true if filename is allowed else false

    :rtype: bool
    """
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def save_uploaded_files(  # pylint: disable=too-many-locals
    request_file, prefix="none", cdnom="0", id_data_source=None, matching_model=None,
):
    """Save files on server and filenames in db from POST request

    for each files in flask request.files, this function does:

        * verify if file type is in allowed media
        * generate a filename from ``prefix``, ``cdnom``, ``index``, ``timestamp``
        * save file in ``./media`` dir
        * save filename in MediaModel and then in a matching media model


    :param request_file: request files from post request.
    :type request_file: function
    :param prefix: filename prefix
    :type prefix: str
    :param cdnom: species id from taxref cdnom
    :type cdnom: int
    :param id_data_source: source id in matching model
    :type id_data_source: int
    :param matching_model: matching model of observation (eg: ``ObservationMediaModel`` or ``SiteMediaModel``)
    :type matching_model: class

    :returns: a filename list
    :rtype: list

    """  # noqa: E501
    files = []
    try:
        i = 0
        for file in request_file.getlist("files"):
            i = i + 1
            filename = file.filename
            current_app.logger.debug(
                "[save_uploaded_files] %s is an allowed filename : %s",
                filename,
                allowed_file(filename),
            )

            if allowed_file(filename):
                # save file
                current_app.logger.debug(
                    '[save_uploaded_files] Preparing file "%s" saving', filename,
                )
                ext = filename.rsplit(".", 1)[1].lower()
                timestamp = now().strftime("%Y%m%d_%H%M%S")
                filename = f"{prefix}_{str(cdnom)}_{i}_{timestamp}.{ext}"
                current_app.logger.debug(
                    "[save_uploaded_files] new filename : %s", filename
                )
                file.save(os.path.join(str(MEDIA_DIR), filename))
                # Save media filename to Database
                try:
                    newmedia = MediaModel(filename=filename)
                    current_app.logger.debug(
                        "[save_uploaded_files] newmedia %s", newmedia
                    )
                    db.session.add(newmedia)
                    db.session.commit()
                    id_media = newmedia.id_media
                    current_app.logger.debug(
                        "[save_uploaded_files] id_media : %s", str(id_media)
                    )
                    # return id_media
                except Exception as e:
                    current_app.logger.debug(
                        "[save_uploaded_files] ERROR MEDIAMODEL: %s", e
                    )
                    raise GeonatureApiError(e)
                # Save id_media in matching table
                try:
                    newmatch = matching_model(
                        id_media=id_media, id_data_source=id_data_source
                    )
                    db.session.add(newmatch)
                    db.session.commit()
                    id_match = newmatch.id_match
                    current_app.logger.debug(
                        "[save_uploaded_files] id_match %s", id_match
                    )
                except Exception as e:
                    current_app.logger.debug(
                        "[save_uploaded_files] ERROR MATCH MEDIA: %s", e
                    )
                    raise GeonatureApiError(e)

                current_app.logger.debug(
                    "[save_uploaded_files] Fichier %s enregistré", filename
                )
                files.append(filename)

    except Exception as e:
        current_app.logger.debug("[save_uploaded_files] ERROR save_upload_file : %s", e)
        raise GeonatureApiError(e)

    return files
