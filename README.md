# datasette-pretty-traces

[![PyPI](https://img.shields.io/pypi/v/datasette-pretty-traces.svg)](https://pypi.org/project/datasette-pretty-traces/)
[![Changelog](https://img.shields.io/github/v/release/simonw/datasette-pretty-traces?include_prereleases&label=changelog)](https://github.com/simonw/datasette-pretty-traces/releases)
[![Tests](https://github.com/simonw/datasette-pretty-traces/workflows/Test/badge.svg)](https://github.com/simonw/datasette-pretty-traces/actions?query=workflow%3ATest)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](https://github.com/simonw/datasette-pretty-traces/blob/main/LICENSE)

Prettier formatting for ?_trace=1 traces

## Installation

Install this plugin in the same environment as Datasette.

    $ datasette install datasette-pretty-traces

## Usage

Once installed, run Datasette using `--setting trace_debug 1`:

    datasette fixtures.db --setting trace_debug 1

Then navigate to any page and add `?_trace=` to the URL:

    http://localhost:8001/?_trace=1

The plugin will scroll you down the page to the visualized trace information.

## Development

To set up this plugin locally, first checkout the code. Then create a new virtual environment:

    cd datasette-pretty-traces
    python3 -mvenv venv
    source venv/bin/activate

Or if you are using `pipenv`:

    pipenv shell

Now install the dependencies and test dependencies:

    pip install -e '.[test]'

To run the tests:

    pytest
