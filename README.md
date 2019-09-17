# GeoNature-citizen

**English:**

GeoNature-citizen is a free and Open Source web solution for citizen science projects for biodiversity data collection. It is fully customizable. Your platform may be a single or a multiple program and be based on existing or ad hoc list of species.
The data collection is gamified to improve the user management using badges and scores. It can also be customized to accept new user to be created or not.
It is based on a fully open Source stack from PostgreSQL to Angular.

**Francais:**

GeoNature-citizen est une solution web gratuite et à code source ouvert pour les projets de science citoyenne destinés à la collecte de données sur la biodiversité. L'outil est entièrement personnalisable. Votre plateforme peut être constituée d'un programme unique ou de plusieurs programmes de collecte et être basée sur une liste d'espèces existante ou adoc.
La collecte de données est ludifiée pour améliorer la gestion des utilisateurs à l’aide de badges et de scores. Elle peut également être personnalisée pour accepter que de nouveaux utilisateurs soient créés ou non.

![Home](https://user-images.githubusercontent.com/45397017/49574639-3019fc80-f941-11e8-8117-5efd7803ff8e.png)

Portail d'inventaire participatif de la biodiversité à destination du grand public

![Screenshot](https://user-images.githubusercontent.com/11497003/61943639-2d394e00-af9c-11e9-94e1-de71753998e1.png)

Les développements de cette première version sur dans la branche [dev](https://github.com/PnX-SI/GeoNature-citizen/tree/dev).

La discussion de préfiguration du projet est [ici](https://github.com/PnX-SI/GeoNature-citizen/issues/2)

## Solutions logicielles

### Backend (API)

- Python 3.5
  - Flask (moteur de l'API)
  - Marshmallow
  - flask-jwt-extended (pour l'authentification)
  - requests (pour l'utilisation d'API externes comme les portails faune-xxx.org)
- PostgreSQL 10 / Postgis 2.4

### Frontend

- NodeJS 8
- Angular 6
- Leaflet
- Bootstrap 41

## L'origine du projet

Ce projet est initialement développé pour répondre aux besoins de collectes participatives dans le cadre des démarches d'atlas de biodiversité communal/territorial (ABC/ABT).
La première version de ce projet est une démarche soutenue par l'agglomération de Valence Romans et développée par la LPO Ardèche.

# Suivi du projet du projet

L'état d'avancement du projet est [ici](https://github.com/PnX-SI/GeoNature-citizen/projects) (à venir).
