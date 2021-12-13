from setuptools import setup
import os

VERSION = "0.1"


def get_long_description():
    with open(
        os.path.join(os.path.dirname(os.path.abspath(__file__)), "README.md"),
        encoding="utf8",
    ) as fp:
        return fp.read()


setup(
    name="datasette-pretty-traces",
    description="Prettier formatting for ?_trace=1 traces",
    long_description=get_long_description(),
    long_description_content_type="text/markdown",
    author="Simon Willison",
    url="https://github.com/simonw/datasette-pretty-traces",
    project_urls={
        "Issues": "https://github.com/simonw/datasette-pretty-traces/issues",
        "CI": "https://github.com/simonw/datasette-pretty-traces/actions",
        "Changelog": "https://github.com/simonw/datasette-pretty-traces/releases",
    },
    license="Apache License, Version 2.0",
    classifiers=[
        "Framework :: Datasette",
        "License :: OSI Approved :: Apache Software License",
    ],
    version=VERSION,
    packages=["datasette_pretty_traces"],
    entry_points={"datasette": ["pretty_traces = datasette_pretty_traces"]},
    install_requires=["datasette"],
    extras_require={"test": ["pytest", "pytest-asyncio"]},
    package_data={"datasette_pretty_traces": ["static/*"]},
    python_requires=">=3.6",
)
