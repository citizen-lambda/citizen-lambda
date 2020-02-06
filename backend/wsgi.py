"""
    Give a unique entry point for gunicorn
"""
import os
if "gunicorn" in os.environ.get("SERVER_SOFTWARE", ""):
    import gevent.monkey
    gevent.monkey.patch_all()
from server import get_app
from gncitizen.utils.env import load_config, get_config_file_path

# get the app config file
config = load_config()

# give the app context from server.py in a app object
app = get_app(config)
port = app.config["API_PORT"] if app.config.get("API_PORT", False) else 5002

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=port, extra_files=get_config_file_path(), processes=3)
