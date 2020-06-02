#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""A module to manage jwt"""

from functools import wraps

from flask import current_app
from flask_jwt_extended import get_jwt_identity

from gncitizen.core.users.models import UserModel


def get_id_role_if_exists():
    """get id_role if exists from ``get_jwt_identity()``

    :return: user id
    :rtype: int
    """
    user = get_jwt_identity()
    if user:
        id_role = UserModel.query.filter_by(username=user).one().id_user
    else:
        id_role = None
    return id_role


def admin_required(func):
    @wraps(func)
    def decorated_function(*args, **kwargs):
        unauthorized_msg = {"message": "Administrative authorization required"}
        user = get_jwt_identity()
        if not user:
            return unauthorized_msg, 403
        current_app.logger.warn("admin_user:", user)
        try:
            user = UserModel.query.filter_by(username=user)
            if not user.admin:
                return unauthorized_msg, 403
            return func(*args, **kwargs)
        except Exception as exc:
            current_app.logger.error("admin_required::%s: %s", user, str(exc))
            return unauthorized_msg, 500

    return decorated_function
