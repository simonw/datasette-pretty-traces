from datasette import hookimpl
from datasette.app import Datasette
from datasette.utils.asgi import Response
from datasette.plugins import pm
import pytest


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "trace_debug,_trace,expected",
    (
        (False, False, False),
        (False, True, False),
        (True, False, False),
        (True, True, True),
    ),
)
async def test_script_included_conditions(trace_debug, _trace, expected):
    datasette = Datasette([], memory=True, settings={"trace_debug": trace_debug})
    path = "/_memory?sql=select+1"
    if _trace:
        path += "&_trace=1"
    response = await datasette.client.get(path)
    assert response.status_code == 200
    fragment = "datasette-pretty-traces.js"
    if expected:
        assert fragment in response.text
    else:
        assert fragment not in response.text


@pytest.mark.asyncio
async def test_does_not_break_pages_with_no_request():
    async def hello(datasette):
        return Response.html(await datasette.render_template("show_json.html"))

    class HelloRoutePlugin:
        __name__ = "HelloRoutePlugin"

        @hookimpl
        def register_routes(self):
            return [(r"^/hello$", hello)]

    pm.register(HelloRoutePlugin(), name="HelloRoutePlugin")
    try:
        ds = Datasette(memory=True, files=[])
        response = await ds.client.get("/hello")
        assert response.status_code == 200
    finally:
        pm.unregister(name="HelloRoutePlugin")


@pytest.mark.asyncio
async def test_pretty_traces_demo_route():
    ds = Datasette([], memory=True)
    response = await ds.client.get("/-/pretty-traces")
    assert response.status_code == 200
    assert "Pretty traces demo" in response.text
    # Basic smoke tests that the interactive elements and example SQL are present
    assert "pt-fetch-versions" in response.text
    assert "pt-fetch-home" in response.text
    assert "/-/versions.json" in response.text
    assert "select 1 as one" in response.text
