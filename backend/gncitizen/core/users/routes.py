import uuid
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from flask import request, Blueprint, current_app  # , json
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    get_jwt,
    get_jwt_identity,
    jwt_required,
)

from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from gncitizen.utils.errors import GeonatureApiError
from gncitizen.utils.env import db
from gncitizen.core.observations.models import ObservationModel
from gncitizen.core.users.models import UserModel, RevokedTokenModel


routes = Blueprint("users", __name__)


@routes.route("/registration", methods=["POST"])
def registration():
    """
    User registration
    ---
    tags:
        - Authentication
    summary: register user
    consumes:
        - application/json
    produces:
        - application/json
    parameters:
        - name: body
          in: body
          description: JSON parameters
          required: true
          schema:
          required:
              - name
              - surname
              - username
              - email
              - password
          properties:
              name:
              type: string
              surname:
              type: string
              username:
              type: string
              example: user1
              email:
              type: string
              password:
              type: string
              example: user1
    responses:
        200:
            description: user created
    """
    try:
        request_data = dict(request.get_json())
        data_to_save = dict()
        for data in request_data:
            if hasattr(UserModel, data) and data != "password":
                data_to_save[data] = request_data[data]

        data_to_save["password"] = UserModel.generate_hash(request_data["password"])

        data_to_save["admin"] = False

        try:
            newuser = UserModel(**data_to_save)
        except Exception as e:
            db.session.rollback()
            current_app.logger.critical(e)
            # raise GeonatureApiError(e)
            return (
                {"message": "les informations d'enregistrement sont erronées."},
                400,
            )

        try:
            newuser.save_to_db()
        except IntegrityError as e:
            db.session.rollback()
            # error causality ?
            current_app.logger.critical("IntegrityError: %s", str(e))

            if UserModel.find_by_username(newuser.username):
                return (
                    {
                        "message": f"""L'utilisateur "{newuser.username}" est déjà enregistré."""  # noqa: E501
                    },
                    400,
                )

            if (
                db.session.query(UserModel)
                .filter(UserModel.email == newuser.email)
                .one()
            ):
                return (
                    {"message": "Un email correspondant est déjà enregistré."},
                    400,
                )

            raise GeonatureApiError(e)

        access_token = create_access_token(identity=newuser.username)
        refresh_token = create_refresh_token(identity=newuser.username)
        return (
            {
                "message": """Félicitations, l'utilisateur "{}" a été créé""".format(
                    newuser.username
                ),
                "username": newuser.username,
                "access_token": access_token,
                "refresh_token": refresh_token,
            },
            200,
        )

    except Exception as e:
        current_app.logger.critical("grab all: %s", str(e))
        return {"message": str(e)}, 500


@routes.route("/login", methods=["POST"])
def login():
    """
    User login
    ---
    tags:
        - Authentication
    summary: Login
    consumes:
        - application/json
    produces:
        - application/json
    parameters:
        - name: body
          in: body
          description: JSON parameters
          required: true
          schema:
          required:
              - username
              - password
          properties:
              username:
              type: string
              password:
              type: string
    responses:
        200:
            description: user created
    """
    try:
        request_data = dict(request.get_json())
        username = request_data["username"]
        password = request_data["password"]
        try:
            current_user = UserModel.find_by_username(username)
            if UserModel.verify_hash(password, current_user.password):
                access_token = create_access_token(identity=username)
                refresh_token = create_refresh_token(identity=username)
                return (
                    {
                        "message": f"""Connecté en tant que "{username}".""",
                        "username": username,
                        "access_token": access_token,
                        "refresh_token": refresh_token,
                    },
                    200,
                )
            current_app.logger.critical(
                "login failure: invalid credentials for user `%s`", username
            )
            return (
                {"message": "Les informations d'identification sont erronées"},
                400,
            )
        except Exception:
            current_app.logger.critical(
                "login failure: non-existant user `%s`", username
            )
            return (
                {"message": f"""L'utilisateur "{username}" n'est pas enregistré."""},
                400,
            )
    except Exception as e:
        current_app.logger.critical("login failure: %s", str(e))
        return {"message": "Tentative de login auditée"}, 400


@routes.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    """
    User logout
    ---
    tags:
        - Authentication
    summary: Logout
    consumes:
        - application/json
    produces:
        - application/json
    parameters:
        - name: authorization
          in: authorization
          description: JSON parameter
          required: true
          schema:
          required:
              - authorization
          properties:
              authorization:
              type: string
              example: Bearer eyJhb…pXVCJ9.eyJpZGVu…jIwNzg5NH0.oZKoy…xVjpCptE
    responses:
        200:
            description: user disconnected
    """
    try:
        jti = get_jwt()["jti"]
        revoked_token = RevokedTokenModel(jti=jti)
        revoked_token.add()
        return {"message": "Successfully logged out"}, 200
    except Exception:
        return {"message": "Something went wrong"}, 500


@routes.route("/token_refresh", methods=["POST"])
@jwt_required(refresh=True)
def token_refresh():
    """Refresh token
    ---
    tags:
      - Authentication
    summary: Refresh token for logged user
    produces:
      - application/json
    responses:
      200:
        description: list all logged users
    """
    current_user = get_jwt_identity()
    access_token = create_access_token(identity=current_user)
    return {"access_token": access_token}, 200


@routes.route("/user/info", methods=["GET", "POST"])
@jwt_required()
def user_info():
    """current user record
    ---
    tags:
      - Authentication
    summary: current registered user
    produces:
      - application/json
    responses:
      200:
        description: current user model
    """
    try:
        current_user = get_jwt_identity()
        user = UserModel.query.filter_by(username=current_user).one()
        if user and request.method == "GET":
            result = user.as_user_dict()
            # base stats, to enhance as we go
            result["stats"] = {
                "platform_attendance": db.session.query(
                    func.count(ObservationModel.id_role)
                )
                .filter(
                    # pylint: disable=comparison-with-callable
                    ObservationModel.id_role
                    == user.id_user
                )
                .one()[0]
            }
            return (
                {"message": "Vos données personelles", "features": result},
                200,
            )

        if user and request.method == "POST":
            is_admin = user.admin or False
            request_data = dict(request.get_json())
            for data in request_data:
                if hasattr(UserModel, data) and data not in {
                    "id_user",
                    "password",
                    "admin",
                }:
                    setattr(user, data, request_data[data])

            user.password = UserModel.generate_hash(request_data["password"])
            user.admin = is_admin
            user.update()
            return (
                {
                    "message": "Informations personnelles mises à jour.",
                    "features": user.as_user_dict(),
                },
                200,
            )
        return (
            {"message": "Connectez vous pour obtenir vos données personnelles."},
            400,
        )
    except Exception as e:
        current_app.logger.warning(
            "[user_info] error with method `%s` %s:", request.method, str(e)
        )
        return (
            {"message": "Connectez vous pour obtenir vos données personnelles."},
            400,
        )


@routes.route("/user/delete", methods=["DELETE"])
@jwt_required()
def delete_account():
    """delete user record
    ---
    tags:
      - Authentication
    summary: Delete user record
    consumes:
      - application/json
    produces:
      - application/json
    responses:
      200:
        description: user record deleted
    """
    username = get_jwt_identity()
    if username:
        try:
            db.session.query(UserModel).filter(UserModel.username == username).delete()
            db.session.commit()
            jti = get_jwt()["jti"]
            revoked_token = RevokedTokenModel(jti=jti)
            revoked_token.add()
            #
            # TODO: anonymize corresponding observations
            #
            current_app.logger.info("[delete account] `%s` deleted", username)
        except Exception as e:
            db.session.rollback()
            current_app.logger.critical(
                "[delete account] `%s` deletion failure: %s", username, str(e)
            )
            return (
                {"message": "Une erreur est survenue: contactez l'administrateur."},
                500,
            )

        return (
            {
                "message": f"""Le compte "{username}" a été supprimé, \
                les observations correspondantes seront anonymisées(WIP)."""
            },
            200,
        )
    return (
        {"message": "Connectez vous pour supprimer vos données personnelles."},
        400,
    )


# TODO: reset_passwd|login|register debounce + ban?(5)


@routes.route("/user/resetpasswd", methods=["POST"])
def reset_password():
    request_data = dict(request.get_json())
    try:
        email = request_data["email"]
        username = request_data["username"]
        user = UserModel.query.filter_by(username=username, email=email).one()
    except Exception:
        current_app.logger.critical(
            "reset password failure: invalid email for user `%s`", username or "__?__",
        )
        return (
            {
                "message": f"""L'email "{email or '?'}" \
                    ou le compte "{username or '?'} ne correspondent pas."""
            },
            400,
        )

    passwd = uuid.uuid4().hex[0:6]
    passwd_hash = UserModel.generate_hash(passwd)

    msg = MIMEMultipart("alternative")
    msg["Subject"] = current_app.config["RESET_PASSWD"]["SUBJECT"]
    msg["From"] = current_app.config["RESET_PASSWD"]["FROM"]
    msg["To"] = user.email

    # Record the MIME types of both parts - text/plain and text/html.
    part1 = MIMEText(
        current_app.config["RESET_PASSWD"]["TEXT_TEMPLATE"].format(
            passwd=passwd, app_url=current_app.config["URL_APPLICATION"]
        ),
        "plain",
    )
    part2 = MIMEText(
        current_app.config["RESET_PASSWD"]["HTML_TEMPLATE"].format(
            passwd=passwd, app_url=current_app.config["URL_APPLICATION"]
        ),
        "html",
    )

    # Attach parts into message container.
    # According to RFC 2046, the last part of a multipart message, in this case
    # the HTML message, is best and preferred.
    msg.attach(part1)
    msg.attach(part2)

    try:
        with smtplib.SMTP_SSL(
            current_app.config["MAIL"]["MAIL_HOST"],
            int(current_app.config["MAIL"]["MAIL_PORT"]),
        ) as server:
            server.login(
                str(current_app.config["MAIL"]["MAIL_AUTH_LOGIN"]),
                str(current_app.config["MAIL"]["MAIL_AUTH_PASSWD"]),
            )
            server.sendmail(
                current_app.config["MAIL"]["MAIL_FROM"], user.email, msg.as_string(),
            )
            server.quit()
        user.password = passwd_hash
        db.session.commit()
        return (
            {"message": "Check your email: your credentials have been updated."},
            200,
        )
    except Exception as e:
        current_app.logger.critical(
            "reset password failure: email with new pass not sent to `%s`, reason: %s",
            username,
            str(e),
        )
        return (
            {"message": f"Echec d'envoi des informations de connexion."},
            500,
        )
