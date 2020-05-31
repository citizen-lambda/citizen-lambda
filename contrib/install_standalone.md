# Standalone install

## prérequis

- [x] j'ai commandé un nom de domaine,
- [x] le service de résolution de nom de domaine (…chez le même fournisseur),
- [x] mis à jour la zone DNS avec un enregistrement A pointant sur l'IP du VPS,
- [x] finallement lié le VPS au domain via l'onglet <cite>DNS Secondaire</cite>
      de l'interface d'administration du VPS.

## prise en main

```sh
ssh root@vps-123
```

```sh
lsb_release -a
# No LSB modules are available.
# Distributor ID: Debian
# Description: Debian GNU/Linux 10 (buster)
# Release: 10
# Codename: buster

adduser pat
# Adding user `pat' …
# Adding new group `pat' (1001) …
# Adding new user `pat' (1001) with group `pat' …
# Creating home directory `/home/pat' …
# Copying files from `/etc/skel' …
# New password: …
# Retype new password: …
# ...
sudo usermod -a -G sudo pat
# sudo apt update …
```

```sh
ssh pat@vps-123
```

```sh
sudo apt install postgresql postgresql-client postgis \
  python3-pip python3-venv \
  supervisor \
  git \
  apache2 letsencrypt

```

<cite>it works !</cite> La familière <cite>Apache2 Debian Default Page</cite>
est disponible sur le FQDN dans le navigateur.

## la ligne de commande

### l'editeur

```sh
echo 'alias python="/usr/bin/python3"' >> ~/.bash_aliases
echo 'export EDITOR="vim"' >> ~/.bashrc
. ~/.bashrc
git clone https://github.com/editorconfig/editorconfig-vim.git ~/.vim/pack/editorconfig/editorconfig-vim
git clone https://github.com/leafgarland/typescript-vim.git ~/.vim/pack/typescript/start/typescript-vim
mkdir -p ~/.vim/syntax/ && \
  wget https://github.com/hdima/python-syntax/raw/master/syntax/python.vim -O ~/.vim/syntax/python.vim
# curl http… -o ~/.vim/pack/…
mkdir -p ~/.vim/pack/python/start/black/plugin && \
  wget https://raw.githubusercontent.com/psf/black/master/plugin/black.vim -O ~/.vim/pack/python/start/black/plugin/black.vim
```

### `~/.ssh/config` et connnexion distante à la bdd de production

Lors d'une connexion au shell distant, la mise en place d'un tunnel
relayant le port distant 5432 de la bdd au port local 5438
facilite l'exploitation de la bdd avec `PgAdmin` ou `psql` depuis l'hôte local.
Voici l'enregistrement que contient mon propre `~/.ssh/config`:

```sshconf
Host citizendemo
  Hostname citizendemo.patkap.tech
  User pat
  LocalForward 5438 localhost:5432
```

## le backend

### la base de donnée

```sh
sudo -u postgres createuser -e -E -P citizen
sudo -u postgres createdb -e -E UTF8 -O citizen citizendb
sudo -u postgres psql citizendb  -c 'create extension postgis; create extension "uuid-ossp";'
# sudo apt install postgresql-12-postgis-3
# sudo -u postgres psql citizendb  -c 'CREATE EXTENSION postgis; CREATE EXTENSION postgis_raster; CREATE EXTENSION "uuid-ossp";'
```

#### 🐛 dépendances à GeoNature et TaxHub qui restent à isoler

##### restauration des polygones de communes

```sh
# utilisation de la redirection locale via ssh:
# c'est une commande à executer depuis son poste local
/usr/bin/pg_restore --host "localhost" --port "5438" --username "citizen" --no-password --role "citizen" --dbname "citizendb" --verbose --schema "ref_geo" "/home/pat/ref_geo_dump.backup"
```

##### restauration de la taxonomie

```sh
# utilisation de la redirection locale via ssh:
# c'est une commande à executer depuis son poste local
/usr/bin/pg_restore --host "localhost" --port "5438" --username "citizen" --no-password --role "citizen" --dbname "citizendb" --verbose --schema "ref_geo" "/home/pat/taxonomy_dump.backup"
```

### l'environnement

```sh
mkdir -p ~/.local/share/venv/citizen_prod
python3 -m venv ~/.local/share/venv/citizen_prod
source ~/.local/share/venv/citizen_prod/bin/activate
# (citizen_prod) pat@vps-123:~$
python3 -m pip install --upgrade pip setuptools wheel
# curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py
# python3 get-pip.py
wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash
# logout et re-login
# pat@vps-123:~$
source ~/.local/share/venv/citizen_prod/bin/activate
# (citizen_prod) pat@vps-123:~$
nvm install 14.1.0
# …
# Now using node v14.0.1 (npm v6.14.4)
```

### le dépôt du code source

```sh
git clone https://github.com/patkap/GeoNature-citizen.git citizen
cd ~/citizen
git config user.email "patkap@users.noreply.github.com"
git config user.name "patkap"
```

### un premier démarrage du backend en mode verbeux

```sh
cd ~/citizen/backend
# python3 -m pip install -r requirements.txt
python3 setup.py develop
cp ~/citizen/config/default_config.toml.example ~/citizen/config/default_config.toml
$EDITOR ~/citizen/config/default_config.toml
# … éditer à souhait
mkdir ~/citizen/media  # MEDIA_FOLDER
export FLASK_ENV=development; export FLASK_DEBUG=1; export FLASK_RUN_PORT=5002; export FLASK_APP=wsgi; python3 -m flask run --host=0.0.0.0
```

## le frontend

### les dépendances

```sh
nvm use node
cd ~/citizen/frontend
npm install -g @angular/cli@latest
# …
# + @angular/cli@9…
# added 330 packages from 220 contributors in 19.287s
npm install
# … après une longue compilation de `libsass` qui échoue
# added 1287 packages from 1263 contributors and audited 55306 packages in 169.776s
# found 3 vulnerabilities (2 low, 1 high)
#   run `npm audit fix` to fix them, or `npm audit` for details
npm audit fix
# …
# added 131 packages from 35 contributors, removed 127 packages, updated 46 packages and moved 3 packages in 29.306s
# fixed 1 of 3 vulnerabilities in 55306 scanned packages
#   2 package updates for 2 vulnerabilities involved breaking changes
#   (use `npm audit fix --force` to install breaking changes; or refer to `npm audit` for steps to fix these manually)
```

### la configuration du frontend

```sh
$EDITOR ~/citizen/frontend/src/conf/app.config.ts
$EDITOR ~/citizen/frontend/src/conf/map.config.ts
$EDITOR ~/citizen/frontend/angular.json
touch ~/citizen/frontend/src/custom/custom.css
```

```toml
URL_APPLICATION = 'http://citizendemo.patkap.tech:4200/'
API_ENDPOINT = 'http://citizendemo.patkap.tech:5002/api'
```

### un premier démarrage du frontend en mode très verbeux

```sh
npm run start:fr -- --host=0.0.0.0 --disableHostCheck
```

c'est le moment d'aller vérifier
dans le navigateur que l'application se charge depuis
`http://citizendemo.patkap.tech:4200/home`,
de s'enregister, et de mettre à jour le champs booléen
`gnc_core`.`t_users`.`admin` dans la bdd.

## le déploiement

```sh
npm run build:i18n
```

```sh
sudo a2enmod proxy_http
sudo systemctl restart apache2
```

```sh
sudoedit /etc/apache2/sites-available/citizen.conf
```

```apacheconf
# citizen
<VirtualHost *:80>
  ServerName patkap.tech

  RewriteEngine on
  RewriteCond %{HTTPS} !on
  RewriteRule (.*) https://%{HTTP_HOST}%{REQUEST_URI}

</VirtualHost>

<VirtualHost *:443>
    ServerAdmin patkap@no-reply.github.com
    ServerName patkap.tech
    ServerAlias citizendemo.patkap.tech
    DocumentRoot /home/pat/citizen/frontend/dist/
    ErrorLog ${APACHE_LOG_DIR}/error.log
    CustomLog ${APACHE_LOG_DIR}/access.log combined
    SSLEngine on
    SSLProxyEngine on
    SSLCertificateFile /etc/letsencrypt/live/citizendemo.patkap.tech/cert.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/citizendemo.patkap.tech/privkey.pem
    SSLCertificateChainFile /etc/letsencrypt/live/citizendemo.patkap.tech/chain.pem
    SSLProtocol all -SSLv2 -SSLv3
    SSLHonorCipherOrder on
    SSLCompression off
    SSLOptions +StrictRequire
    SSLCipherSuite ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:DHE-DSS-AES128-GCM-SHA256:kEDH+AESGCM:ECDHE-RSA-AES128-SHA256:ECDHE-ECDSA-AES128-SHA256:ECDHE-RSA-AES128-SHA:ECDHE-ECDSA-AES128-SHA:ECDHE-RSA-AES256-SHA384:ECDHE-ECDSA-AES256-SHA384:ECDHE-RSA-AES256-SHA:ECDHE-ECDSA-AES256-SHA:DHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA:DHE-DSS-AES128-SHA256:DHE-RSA-AES256-SHA256:DHE-DSS-AES256-SHA:DHE-RSA-AES256-SHA:AES128-GCM-SHA256:AES256-GCM-SHA384:AES128-SHA256:AES256-SHA256:AES128-SHA:AES256-SHA:AES:CAMELLIA:DES-CBC3-SHA:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!aECDH:!EDH-DSS-DES-CBC3-SHA:!EDH-RSA-DES-CBC3-SHA:!KRB5-DES-CBC3-SHA
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
</VirtualHost>

# Alias /citizen /home/pat/citizen/frontend/dist/browser

<Directory /home/pat/citizen/frontend/dist/>
  Require all granted
  AllowOverride All

  Options -MultiViews

  RewriteEngine On
  # If an existing asset or directory is requested go to it as it is
  RewriteCond %{DOCUMENT_ROOT}%{REQUEST_URI} -f [OR]
  RewriteCond %{DOCUMENT_ROOT}%{REQUEST_URI} -d
  RewriteRule ^ - [L]

  # If the requested resource doesn't exist, use index.html
  RewriteRule ^ /index.html
</Directory>

<Location /api>
  Header set Access-Control-Allow-Origin "*"
  ProxyPass http://127.0.0.1:5002/api
  ProxyPassReverse  http://127.0.0.1:5002/api
</Location>
```

```sh
sudo a2dissite 000-default.conf
sudo apache2ctl configtest
# Syntax OK
sudo systemctl restart apache2
sudo systemctl status apache2.service
```

### serveur http de production

```sh
cd citizen/backend
# python3 -m pip install git+https://github.com/benoitc/gunicorn.git gevent
python3 -mpip install -r requirements_deploy.txt
$EDITOR ~/citizen/backend/start_gunicorn.sh
```

### gestionnaire de processus

```sh
sudoedit /etc/supervisor/conf.d/citizen.conf
```

```conf
[program:citizen]
command = /home/pat/citizen/backend/start_gunicorn.sh
autostart=true
autorestart=true
stdout_logfile = /var/log/supervisor/citizen.log
redirect_stderr = true
```

```sh
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl avail
sudo supervisorctl restart
# tail /var/log/supervisor/citizen.log
```

### https et http2

```sh
sudo certbot certonly --webroot --webroot-path /var/www/html -d citizendemo.patkap.tech
sudo a2enmod ssl
sudo a2enmod http2
sudoedit /etc/apache2/sites-available/citizen.conf
sudo apachectl -t
# sudo tail -f /var/log/apache2/error.log
$EDITOR ~/citizen/config/default_config.toml
$EDITOR ~/citizen/frontend/src/conf/app.config.ts
```

```toml
URL_APPLICATION = 'https://citizendemo.patkap.tech'
API_ENDPOINT = 'https://citizendemo.patkap.tech/api'
```

```sh
sudo supervisorctl restart citizen
cd ~/citizen/frontend && npm run build:i18n
sudo systemctl restart apache2
```

### brotli

```sh
sudo apt install brotli
# TODO: automate optional postbuild brotli packing
for i in ~/citizen/frontend/dist/*/*.{css,js}; do brotli $i; done
sudoedit /etc/apache2/sites-available/citizen.conf
sudo a2enmod brotli
```

```diff
--- citizen.conf.orig  2019-11-07 06:57:22.646056873 +0100
+++ /etc/apache2/sites-available/citizen.conf  2019-11-07 09:57:22.368054082 +0100
@@ -27,8 +27,25 @@
     SSLOptions +StrictRequire
     SSLCipherSuite ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:DHE-DSS-AES128-GCM-SHA256:kEDH+AESGCM:ECDHE-RSA-AES128-SHA256:ECDHE-ECDSA-AES128-SHA256:ECDHE-RSA-AES128-SHA:ECDHE-ECDSA-AES128-SHA:ECDHE-RSA-AES256-SHA384:ECDHE-ECDSA-AES256-SHA384:ECDHE-RSA-AES256-SHA:ECDHE-ECDSA-AES256-SHA:DHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA:DHE-DSS-AES128-SHA256:DHE-RSA-AES256-SHA256:DHE-DSS-AES256-SHA:DHE-RSA-AES256-SHA:AES128-GCM-SHA256:AES256-GCM-SHA384:AES128-SHA256:AES256-SHA256:AES128-SHA:AES256-SHA:AES:CAMELLIA:DES-CBC3-SHA:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!aECDH:!EDH-DSS-DES-CBC3-SHA:!EDH-RSA-DES-CBC3-SHA:!KRB5-DES-CBC3-SHA
     Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
+
+    AddOutputFilterByType BROTLI_COMPRESS text/html text/plain text/xml text/css text/javascript application/x-javascript application/javascript application/json application/ld+json image/svg+xml application/xml+rss application/x-font-ttf application/vnd.ms-fontobject image/x-icon
+    SetEnvIfNoCase Request_URI \
+        \.(gif|jpe?g|png|swf|woff|woff2) no-brotli dont-vary
+
+    #Make sure proxies don't deliver the wrong content
+    Header append Vary User-Agent env=!dont-vary
 </VirtualHost>

+<Files *.js.br>
+  AddType "application/javascript" .br
+  AddEncoding br .br
+</Files>
+
+<Files *.css.br>
+  AddType "text/css" .br
+  AddEncoding br .br
+</Files>
+
 <Directory /home/pat/citizen/frontend/dist/>
   Require all granted
   AllowOverride All
@@ -36,6 +53,11 @@
   Options -MultiViews

   RewriteEngine On
+
+  RewriteCond %{HTTP:Accept-Encoding} br
+  RewriteCond %{REQUEST_FILENAME}.br -f
+  RewriteRule ^(.*)$ $1.br [L]
+
   # If an existing asset or directory is requested go to it as it is
   RewriteCond %{DOCUMENT_ROOT}%{REQUEST_URI} -f [OR]
   RewriteCond %{DOCUMENT_ROOT}%{REQUEST_URI} -d
@@ -46,7 +68,7 @@
 </Directory>

 <Location /api>
-  Header set Access-Control-Allow-Origin "*"
+  Header set Access-Control-Allow-Origin "https://citizendemo.patkap.tech"
   ProxyPass http://127.0.0.1:5002/api
   ProxyPassReverse  http://127.0.0.1:5002/api
 </Location>
```

```apacheconf
<VirtualHost *:80>
  ServerName citizendemo.patkap.tech
  ServerAlias patkap.tech

  RewriteEngine on
  RewriteCond %{HTTPS} !on
  RewriteRule (.*) https://%{HTTP_HOST}%{REQUEST_URI} [R=301,L]

</VirtualHost>

<VirtualHost *:443>
    ServerAdmin patkap@no-reply.github.com
    ServerName patkap.tech
    ServerAlias citizendemo.patkap.tech
    # DocumentRoot /var/www/html
    DocumentRoot /home/pat/citizen/frontend/dist/
    ErrorLog ${APACHE_LOG_DIR}/error.log
    CustomLog ${APACHE_LOG_DIR}/access.log combined
    SSLEngine on
    SSLProxyEngine on
    SSLCertificateFile /etc/letsencrypt/live/citizendemo.patkap.tech/cert.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/citizendemo.patkap.tech/privkey.pem
    SSLCertificateChainFile /etc/letsencrypt/live/citizendemo.patkap.tech/chain.pem
    Protocols h2 http/1.1
    SSLProtocol TLSv1.2
    SSLHonorCipherOrder on
    SSLOptions +StrictRequire
    SSLCipherSuite "EECDH+ECDSA+AESGCM EECDH+aRSA+AESGCM EECDH+ECDSA+SHA384 EECDH+ECDSA+SHA256 EECDH+aRSA+SHA384 EECDH+aRSA+SHA256 EECDH+aRSA+RC4 EECDH EDH+aRSA RC4 !aNULL !eNULL !LOW !3DES !MD5 !EXP !PSK !SRP !DSS +RC4 RC4"

    AddOutputFilterByType BROTLI_COMPRESS text/html text/plain text/xml text/css text/javascript application/x-javascript application/javascript application/json application/ld+json image/svg+xml application/xml+rss application/x-font-ttf application/vnd.ms-fontobject image/x-icon
    SetEnvIfNoCase Request_URI \
        \.(gif|jpe?g|png|swf|woff|woff2) no-brotli dont-vary

    Header append Vary User-Agent env=!dont-vary
    Header set Content-Security-Policy "default-src 'self'; base-uri 'self'; child-src 'self'; connect-src 'self' https://wms.openstreetmap.fr/ https://a.tile.openstreetmap.org/ https://b.tile.openstreetmap.org/ https://c.tile.openstreetmap.org/ https://taxref.mnhn.fr/ https://mt1.google.com/ https://upload.wikimedia.org/ https://cdn.pixabay.com/ https://live.staticflickr.com/ https://www.tourisme-marseille.com/; font-src 'self' https://fonts.gstatic.com/; form-action 'self'; img-src 'self' data: blob: filesystem: https://wms.openstreetmap.fr/ https://a.tile.openstreetmap.org/ https://b.tile.openstreetmap.org/ https://c.tile.openstreetmap.org/ https://taxref.mnhn.fr/ https://mt1.google.com/ https://upload.wikimedia.org/ https://cdn.pixabay.com/ https://live.staticflickr.com/ https://www.tourisme-marseille.com/; manifest-src 'self'; object-src 'none'; script-src 'self'; script-src-elem 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com/; style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com/; frame-ancestors 'none'; worker-src 'self'; report-uri /api/csp_report; upgrade-insecure-requests;"
    Header set X-Frame-Options "DENY" "expr=%{CONTENT_TYPE} =~ m#text/html#i"
    Header set X-Content-Type-Options "nosniff"
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains" "expr=%{HTTPS} == 'on'"
    Header set Referrer-Policy "strict-origin-when-cross-origin" "expr=%{CONTENT_TYPE} =~ m#text\/(css|html|javascript)|application\/pdf|xml#i"
    Header set X-XSS-Protection "1; mode=block" "expr=%{CONTENT_TYPE} =~ m#text/html#i"
    Header unset X-Powered-By
    Header always unset X-Powered-By
</VirtualHost>

SSLProtocol TLSv1.2
SSLHonorCipherOrder off
SSLSessionTickets       off

SSLUseStapling On
SSLStaplingCache "shmcb:logs/ssl_stapling(32768)"

<Files *.js.br>
  AddType "application/javascript" .br
  AddEncoding br .br
</Files>

<Files *.css.br>
  AddType "text/css" .br
  AddEncoding br .br
</Files>

<Directory /home/pat/citizen/frontend/dist/>
  Require all granted
  AllowOverride All

  Options -MultiViews

  RewriteEngine On

  RewriteCond %{REQUEST_METHOD} ^TRACE [NC]
  RewriteRule .* - [R=405,L]

  RewriteBase /

  RewriteRule ^sitemap\.xml$ sitemap.xml [L]

  RewriteCond %{HTTP:Accept-Encoding} br
  RewriteCond %{REQUEST_FILENAME}.br -f
  RewriteRule ^(.*)$ $1.br [L]

  # If an existing asset or directory is requested go to it as it is
  #RewriteCond %{DOCUMENT_ROOT}%{REQUEST_URI} -f [OR]
  #RewriteCond %{DOCUMENT_ROOT}%{REQUEST_URI} -d
  #RewriteRule ^ - [L]

  # If the requested resource doesn't exist, use index.html
  #RewriteRule ^ /index.html

  RewriteRule ^../index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule (..) $1/index.html [L]
  RewriteCond %{HTTP:Accept-Language} ^fr [NC]
  RewriteRule ^$ /fr/ [R]
  RewriteCond %{HTTP:Accept-Language} !^fr [NC]
  RewriteRule ^$ /en/ [R]

</Directory>

<Location /api>
  Header set Access-Control-Allow-Origin "https://citizendemo.patkap.tech"
  ProxyPass http://127.0.0.1:5002/api
  ProxyPassReverse  http://127.0.0.1:5002/api
</Location>
```

…

🐛

```sh
$EDITOR ~/citizen/frontend/src/app/home/home.component.css
```

```css
:root {
  --section-programs_height_min1366: 1100px !important;
  --section-programs_height_max1366: 1100px !important;
}
```

### Updates

```sh
cd frontend
# regenerate the translation files if, somehow, the templates got edited
npm run xi18n  # and diffedit to sync
# TODO: apache rewrite
# cp dist/fr/robots.txt dist/
# cp dist/fr/favicon.ico dist/
# copy/edit sitemap.xml
# $EDITOR dist/sitemap.xml
cp ~/sitemap-citizen.xml dist/sitemap.xml
# do not forget to:
# restart backend after backend/python code changes e.g. git pull
sudo supervisorctl restart citizen
# restart apache after a frontend rebuild: a simple reload won't do
# (angular differential loading and/or apache cache … ?)
sudo systemctl restart apache2
```

### Monitoring

```sh
# whole history overview
sudo bash -c 'zcat /var/log/apache2/access.log.*.gz | sudo goaccess /var/log/apache2/access.log /var/log/apache2/access.log.1 --log-format=COMBINED'
# since midnight … rotation of apache log
sudo goaccess /var/log/apache2/access.log --log-format=COMBINED
```

### Frontend code coverage (not yet enforceable)

open `citizen/frontend/coverage/index.html` in your favorite browser after `npm run test`
