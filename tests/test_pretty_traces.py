from datasette.app import Datasette
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
