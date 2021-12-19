from datasette import hookimpl


@hookimpl
def extra_js_urls(datasette, request):
    if request and request.args.get("_trace") and datasette.setting("trace_debug"):
        return [
            datasette.urls.static_plugins(
                "datasette_pretty_traces", "datasette-pretty-traces.js"
            )
        ]
