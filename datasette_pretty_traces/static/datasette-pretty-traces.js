document.addEventListener("DOMContentLoaded", () => {
  /* Only execute if last <pre> on page contains valid JSON */
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
  function escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
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
  const output = document.createElement("div");
  output.addEventListener("click", (ev) => {
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
  output.style.backgroundColor = "#eee;";
  output.style.fontFamily = "courier";
  output.style.fontSize = "0.7em";
  output.style.margin = "1em";
  output.innerHTML = traceDivs.join("\n");
  lastPre.insertAdjacentElement("beforebegin", output);
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
