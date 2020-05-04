# coding: utf-8
# within venv and backend dir, run python3 setup.py develop
from pathlib import Path

import pkg_resources
from setuptools import find_packages, setup


install_requires = []
with Path("requirements.txt").open(mode="r", encoding="utf-8") as requirements_txt:
    install_requires = [
        str(requirement)
        for requirement in pkg_resources.parse_requirements(requirements_txt)
    ]

setup(
    name="gncitizen-lambda",
    version="0.0.1",
    install_requires=install_requires,
    packages=find_packages(),
    description="citizen science, biodiversity, share your observations !",
    long_description=Path(__file__).parent.joinpath("README.md").read_text(),
    long_description_content_type="text/markdown",
    keywords="citizen science, biodiversity, geospatial, angular, python",
    url="https://github.com/citizen-lambda/citizen-lambda",
    license="GNU AGPL",
    classifiers=[
        "Programming Language :: Python :: 3.7",
        "License :: OSI Approved :: GNU Affero General Public License v3",
        "Operating System :: POSIX :: Linux",
        "Development Status :: 4 - Beta",
    ],
    python_requires=">=3.7",
)

if __name__ == "__main__":
    setup()
