# within venv and backend dir, run python3 setup.py install
from setuptools import find_packages, setup


setup(
    name="gncitizen", packages=find_packages(),
)

if __name__ == "__main__":
    setup()
