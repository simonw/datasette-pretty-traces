from datasette import hookimpl
from datasette.utils.asgi import Response


@hookimpl
def extra_js_urls(datasette, request):
    if request and request.args.get("_trace") and datasette.setting("trace_debug"):
        return [
            datasette.urls.static_plugins(
                "datasette_pretty_traces", "datasette-pretty-traces.js"
            )
        ]


@hookimpl
def register_routes():
    return [
        (r"^/-/pretty-traces$", pretty_traces_demo),
    ]


async def pretty_traces_demo(datasette, request):
    db = datasette.get_database()
    examples = [
        "select 1 as one, 2 as two",
        "select sqlite_version() as sqlite_version",
        "select datetime('now') as now_utc, time('now') as time_utc",
        "select json_object('hello', 'world', 'answer', 42) as example_json",
    ]

    rendered = []
    for sql in examples:
        try:
            results = await db.execute(sql)
            rendered.append(
                {
                    "sql": sql,
                    "columns": results.columns,
                    "rows": [dict(r) for r in results.rows],
                }
            )
        except Exception as ex:
            rendered.append({"sql": sql, "error": str(ex), "columns": [], "rows": []})

    html = await datasette.render_template(
        "pretty_traces_demo.html",
        {
            "database_name": db.name,
            "examples": rendered,
            "versions_json_url": datasette.urls.path("/-/versions.json"),
            "home_url": datasette.urls.path("/"),
        },
        request=request,
    )
    return Response.html(html)
