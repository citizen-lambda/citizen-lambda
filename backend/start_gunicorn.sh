#!/bin/bash

FLASKDIR=$(readlink -e "${0%/*}")
APP_DIR="$(dirname "$FLASKDIR")"
venv_dir="/home/pat/.local/share/venv/citizen_prod"
LOG_DIR="$APP_DIR/var/log"

echo "Starting $app_name"
echo "FLASKDIR: $FLASKDIR"
echo "APP_DIR: $APP_DIR"
echo "VENV: $venv_dir"
echo "LOG_DIR: $LOG_DIR"

# activate the virtualenv
source $venv_dir/bin/activate

cd $FLASKDIR

# Start your gunicorn
if [[ ! -e $LOG_DIR ]]; then
    mkdir -p $LOG_DIR
elif [[ ! -d $LOG_DIR ]]; then
    echo "LOG_DIR already exists but is not a directory" 1>&2
    exit 127
fi

echo "Starting gunicorn"
exec gunicorn -k gevent -w 1 --error-log $APP_DIR/var/log/gn_errors.log --pid="citizen.pid" -b :5002 --reload --preload -n "citizen" wsgi:app
