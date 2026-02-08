document.addEventListener("DOMContentLoaded", () => {
  function escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function renderTracesHtml(jsonData) {
    const min_start = Math.min(...jsonData.traces.map((t) => t.start)),
      max_end = Math.max(...jsonData.traces.map((t) => t.end)),
      width_s = max_end - min_start;
    const traceDivs = jsonData.traces.map((trace) => {
      const trace_width_s = trace.end - trace.start;
      const ms = trace_width_s * 1000;
      const w = (trace_width_s / width_s) * 100;
      const left_s = trace.start - min_start;
      const left = (left_s / width_s) * 100;
      const sql = trace.sql.replace(/\n/g, " ");
      const traceback = trace.traceback.map(
        (s) => s.split("site-packages/").slice(-1)[0]
      );
      let paramsHtml = '';
      if (trace.params) {
        paramsHtml = '\n\nParameters: ' + escapeHtml(JSON.stringify(trace.params, null, 4));
      }
      let many = '';
      if (trace.executemany && trace.count) {
        many = `${trace.count}x `;
      }
      return `<div
        class="trace-line"
        style="
          position: relative;
          border-bottom: 3px solid white;
          height: 1.6em;${trace.error ? " background-color: #fdd;" : ""}
          overflow: hidden"
        title="${ms.toFixed(2)}ms ${escapeHtml(
        JSON.stringify(traceback, null, 4)
      )}"
        >${escapeHtml(trace.database)}: ${many}${escapeHtml(sql)}
          <div style="
            position: absolute;
            top: 0;
            left: ${left}%;
            width: ${w}%;
            overflow: hidden;
            background-color: #ccc;
            border: 1px solid black;
            margin-bottom: 2px;
            height: 1.35em;
            opacity: 0.5"
          ></div>
      </div>
      <div class="trace-details" style="display: none">
        <strong>${ms.toFixed(2)}ms, ${(left_s * 1000).toFixed(2)}ms from start</strong>
        <span style="color:red">${trace.error || ''}</span>
        <pre style="white-space: pre-wrap">

${escapeHtml(trace.sql.trim())}

</pre><pre style="white-space: pre-wrap; color: #808080">
${escapeHtml(trace.traceback.join("\n"))}${paramsHtml}
</pre>
      </div>`;
    });
    const summaryHtml = `
      <div style="
        padding: 0.5em;
        margin-bottom: 1em;
        background-color: #fff;
        border: 1px solid #ccc;
        border-radius: 3px;
        font-size: 1.2em;">
        <strong>Request time:</strong> ${jsonData.request_duration_ms?.toFixed(2) || 'N/A'} ms |
        <strong>Total SQL time:</strong> ${jsonData.sum_trace_duration_ms?.toFixed(2) || 'N/A'} ms |
        <strong>SQL queries:</strong> ${jsonData.num_traces || 0}
      </div>
    `;
    return summaryHtml + traceDivs.join("\n");
  }

  function attachTraceLineClickHandler(container) {
    container.addEventListener("click", (ev) => {
      ev.preventDefault();
      let line = ev.target.closest(".trace-line");
      if (!line) {
        return;
      }
      let details = line.nextElementSibling;
      if (details.style.display == "block") {
        details.style.display = "none";
      } else {
        details.style.display = "block";
      }
    }, true);
  }

  // Container for fetch trace sections
  const fetchTracesContainer = document.createElement("div");

  function appendFetchTrace(url, traceData) {
    const details = document.createElement("details");
    details.style.margin = "0.5em 1em";
    const summary = document.createElement("summary");
    summary.style.cursor = "pointer";
    summary.style.fontFamily = "courier";
    summary.style.fontSize = "0.8em";
    summary.textContent = "fetch: " + url;
    details.appendChild(summary);
    const inner = document.createElement("div");
    inner.style.backgroundColor = "#eee";
    inner.style.fontFamily = "courier";
    inner.style.fontSize = "0.7em";
    inner.style.margin = "0.5em 0";
    inner.innerHTML = renderTracesHtml(traceData);
    attachTraceLineClickHandler(inner);
    details.appendChild(inner);
    fetchTracesContainer.appendChild(details);
  }

  // Override window.fetch to intercept same-host requests
  const originalFetch = window.fetch;
  window.fetch = async function(input, init) {
    let url;
    let isRequest = input instanceof Request;
    try {
      if (isRequest) {
        url = new URL(input.url);
      } else {
        url = new URL(input, window.location.href);
      }
    } catch {
      return originalFetch.call(this, input, init);
    }

    if (url.host !== window.location.host) {
      return originalFetch.call(this, input, init);
    }

    const displayUrl = url.pathname + url.search;
    url.searchParams.set("_trace", "1");

    let modifiedInput;
    if (isRequest) {
      modifiedInput = new Request(url.toString(), input);
    } else {
      modifiedInput = url.toString();
    }

    const response = await originalFetch.call(this, modifiedInput, init);

    try {
      const clone = response.clone();
      const contentType = clone.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const json = await clone.json();
        if (json._trace && json._trace.traces) {
          appendFetchTrace(displayUrl, json._trace);
        }
      } else if (contentType.includes("text/html")) {
        const html = await clone.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const pres = doc.getElementsByTagName("pre");
        if (pres.length) {
          const lastPre = pres[pres.length - 1];
          try {
            const traceData = JSON.parse(lastPre.textContent);
            if (traceData.traces) {
              appendFetchTrace(displayUrl, traceData);
            }
          } catch {}
        }
      }
    } catch {}

    return response;
  };

  /* Only execute main page trace rendering if last <pre> on page contains valid JSON */
  const pres = document.getElementsByTagName("pre");
  if (!pres.length) {
    return;
  }
  const lastPre = pres[pres.length - 1];
  let jsonData;
  try {
    jsonData = JSON.parse(lastPre.innerText);
  } catch {
    return;
  }
  if (!jsonData.traces) {
    return;
  }

  const output = document.createElement("div");
  attachTraceLineClickHandler(output);
  output.style.backgroundColor = "#eee;";
  output.style.fontFamily = "courier";
  output.style.fontSize = "0.7em";
  output.style.margin = "1em";
  output.innerHTML = renderTracesHtml(jsonData);
  lastPre.insertAdjacentElement("beforebegin", output);

  // Insert fetch traces container after the main output
  output.insertAdjacentElement("afterend", fetchTracesContainer);

  // Scroll user to that point
  output.scrollIntoView();
  // Stick the detailed JSON in a details/summary
  const details = document.createElement("details");
  details.style.margin = "0.5em";
  const summary = document.createElement("summary");
  summary.innerText = "Show JSON traces";
  details.appendChild(summary);
  lastPre.insertAdjacentElement("beforebegin", details);
  details.appendChild(lastPre);
});
