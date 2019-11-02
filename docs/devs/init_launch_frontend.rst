
********************************
Configurer et lancer le frontend
********************************

Installation de l'environnement virtuel NodeJS avec nvm
#######################################################

L'installation de ``nvm`` se fait en suivant les instructions du dépot principal de l'outil nvm par creationix `creationix/nvm <https://github.com/creationix/nvm#installation-and-update>`_.

Une fois l'environnement installé, installer la dernière version stable de ``nodejs``:

.. code:: sh

    nvm install --lts

Pour utiliser cette version:

.. code:: sh

    nvm use --lts

Installer angular CLI (version LTS 6) et les dépendances requises:

.. code:: sh

    npm install -g @angular/cli@v6-lts
    npm install


Configuration du frontend
#########################

Réglages généraux du frontend:
******************************
``frontend/src/conf/app.config.ts``

Paramètres de cartographie:
***************************
``frontend/src/conf/map.config.ts``

Surcharge du rendu CSS:
***********************
``frontend/src/custom.css``

Image par défaut pour les taxons sans image:
********************************************
Lier l'illustration par défaut des taxons sans photo:

.. code:: sh

    ln -s image_taxon_par_defaut.jpg default_taxon.jpg


TODO: AppConf.no_taxon_pic = 'no_taxon.(svg,jpg,png)'

Gestion du Server Side Rendering
################################

Le SSR a été intégré au projet à partir de la commande :

.. code-block:: sh

    npm run ng -- add @nguniversal/express-engine --clientProject frontend

NB:
Nous avons pris le parti d'utiliser des "`mock <https://fr.wikipedia.org/wiki/Mock_(programmation_orientée_objet)>`_" pour les objets couplés
à la plateforme (window, localStorage, etc).
L'intégration de Leaflet.MarkerCluster a nécessité de déclarer une variable
globale ``L`` et d'y importer Leaflet: tout est dans le script ``server.ts``.

Les modules ``BrowserTransferState`` et ``ServerTransferState`` importés, nous avons créé un couple ``{clé: valeur}`` pour être transféré du serveur au client.

La clé est créée avec la fonction factory `makeStateKey <https://angular.io/api/platform-browser/StateKey#description>`_ :

.. code-block:: typescript

    const PROGRAMS_KEY = makeStateKey("programs");

Le transfert d'état s'effectue avec accesseur et mutateur:

.. code-block:: javascript

    this.programs = this.state.get(PROGRAMS_KEY, null);
    if (!this.programs) {
      /*
        code exécuté côté serveur Node, express
        qui effectue donc un appel à l'API de GN-Citizen
        et génère une capture d'état
      */

      this.state.set(PROGRAMS_KEY, programs as Programs[]);
    } else {
      /*
        code exécuté côté présentation qui consomme l'état "cristallisé"
        transféré depuis le serveur.
      */
    }

Le démarrage du service sur le port ``4000`` s'effectue via le oneliner :

.. code-block:: sh

    npm run serve:ssr

La redirection de port pourrait se faire au niveau du reverse proxy,
avec un filtre sur l'entête de requête ``User-Agent``

Gestion de l'internationalisation (i18n)
########################################

La fonctionnalité i18n a été intégrée selon `la recette originale <https://angular.io/guide/i18n>`_.

L'interface est paramétrée par défaut en langue française.


Si l'on souhaitait la servir en langue anglaise:

.. code-block:: sh

    npm run ng -- serve --configuration=en

La stratégie, en cas de traduction manquante, est de faire remonter une erreur.

(Ré)génération des fichiers de traduction:
******************************************

.. code-block:: sh

    npm run ng -- xi18n --output-path locale --out-file _messages.fr.xlf --i18n-locale fr

.. code-block:: sh

    npm run ng -- xi18n --output-path locale --out-file _messages.en.xlf --i18n-locale en


Les fichiers de traduction se retrouvent dans le répertoire ``frontend/src/locale``.

Les copier en ``messages.fr.xlf`` et ``messages.en.xlf`` après édition (mon approche est de les mettre à jour depuis un éditeur de différence).

Note: La détection de la langue préférée pourrait se faire au niveau du serveur web / reverse proxy, avec un filtre sur l'entête de requête ``Accept-Language``

Construction du frontend multilingue:
*************************************

.. code-block:: sh

    npm run build:i18n-ssr

Lancer le frontend
##################

Le frontend supporte deux modes de lancement:
*********************************************

Un mode ``développement``, avec un rendu côté client:

.. code:: sh

    npm run start

Et un mode ``production``, multilingue, avec rendu serveur (ssr) optimisé pour le SEO et les robots d'indexation:

.. code:: sh

    npm run build:i18n-ssr && PORT=8080 npm run serve:ssr

Déploiement
###########

Informations personnelles:
**************************

Les échanges entre backend et frontend
sont cryptés si le réseau n'est pas sécurisé.

Notre actuel système d'authentification et d'administration,
basé sur l'échange de `JWT <https://tools.ietf.org/html/rfc7519>`_
(TODO: Migrer vers `JWS <https://tools.ietf.org/html/rfc7797>`_),
dépendent en effet de cette infrastructure.

Ainsi la mise en oeuvre de HTTPS ou d'un VPN est nécessaire
pour garantir le transfert sécurisé de données potentiellement personnelles.

Les données à caractère personnel
(mdp, email, N° de téléphone, types d'appareil,
adresses IP et horodatages des connexions,
localisation,
journaux de connexion et de consultations ou d'éventuel debogage,
etc ...)
si collectées, doivent être retenues confidentiellement.
Ainsi leur stockage est, lui aussi crypté,
son emplacement géographiquement déterminé (pays?),
sa sauvegarde assurée.

L'utilisateur est tenu informé des services ou processeurs tiers connus
(services de localisation,
les fournisseurs de tuiles,
médias et autres actifs extérieurs),
des services sous-traitants
(fournisseurs de solution d'hébergement, stockage de contenu, etc).

L'usage de ces informations est justifié
et présenté de façon transparente
à l'utilisateur,
avant d'accéder à son consentement.
(
opérations de maintenance: email pour obtenir un nouveau mdp,
opérations d'amélioration: optimisation du site,
obligations légales?: conservation des journaux de connexion par IP,
...).

L'application offre un accès libre quant à l'anonymat ou l'authentification.
Il en va de la responsabilité
des équipes de développement,
de maintenance
mais aussi de l'utilisateur
de mettre tout en oeuvre pour garantir la pérennité de ce choix.


Mode ``production`` de base:
****************************

Effectuer la compilation de la distribution avec:

.. code-block:: sh

    npm run ng -- build --prod

ou:

.. code-block:: sh

    npm run ng -- build --configuration=en --prod

pour une version en langue anglaise.

Tout est alors contenu dans le répertoire ``frontend/dist``, qu'il faut copier sur la plate-forme offrant le service web.

Mode ``production`` avec ssr et internationalisation:
*****************************************************

.. code-block:: sh

    PORT=8080 npm run serve:ssr

NB: Il était question de mettre en place pm2 ou d'utiliser supervisord pour gérer le processus ...

Annexe:
#######

Exemple de fichier de configuration serveur Apache2:
****************************************************
``/etc/apache2/sites-enabled/citizen.conf``

.. code-block:: conf

    # Configuration GeoNature-citizen
    Alias /citizen /home/utilisateur/citizen/frontend/dist/browser

    <Directory /home/utilisateur/citizen/frontend/dist/browser>
      Require all granted
      AllowOverride All

      <IfModule mod_rewrite.c>
          Options -MultiViews

          RewriteEngine On
            RewriteCond %{REQUEST_FILENAME} !-d
            RewriteCond %{REQUEST_FILENAME} !-f
              RewriteRule ".*" "index.html" [QSA,L]
      </IfModule>

    </Directory>
    <Location /citizen/api>
      ProxyPass http://127.0.0.1:5002/api
      ProxyPassReverse  http://127.0.0.1:5002/api
    </Location>

Suivi des journaux d'évenements et d'erreurs:
*********************************************

Backend:
========

.. code-block:: sh

    tail -f /var/log/supervisor/citizen.log


Gunicorn (option de gestion de processus pour lancer le backend):
=================================================================

.. code-block:: sh

    tail -f ~/citizen/var/log/gn_errors.log


Apache:
=======

.. code-block:: sh

    sudo tail -f /var/log/apache2/{error,access,other_vhosts_access}.log


Utiliser PgAdmin pour la gestion de la BDD distante (production):
=================================================================

``~/.ssh/config``

.. code-block:: conf

    Host nom_du_raccourci
    Hostname son_addresse_ip
    User mon_user
    LocalForward 5433 localhost:5432

Se logguer en SSH (``ssh nom_du_raccourci``) sur l'hôte distant va opérer une redirection de port et rendre la BDD distante accessible sur le port local ``5433`` pour un client PostgreSQL.

Il suffit alors d'ajuster les paramètres de ``psql`` en CLI ou ceux de l'assistant de configuration de PgAdmin pour son interface graphique.
