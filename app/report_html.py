import html
from pathlib import Path


TEMPLATE_PATH = Path(__file__).parent / "report_template.html"


def _escape(text: str) -> str:
    return html.escape(text, quote=True)


def generate_html_report(jest_results: dict, missing_coverage: list[dict]) -> str:
    """Generate an HTML report from Jest results and missing coverage data."""
    template = TEMPLATE_PATH.read_text(encoding="utf-8")

    total = jest_results.get("total", 0)
    passed = jest_results.get("passed", 0)
    failed = jest_results.get("failed", 0)
    suites = jest_results.get("suites_total", 0)

    # Status
    if "error" in jest_results:
        status_class = "fail"
        status_icon = "&#x274C;"
        status_text = "Jest Execution Error"
    elif failed > 0:
        status_class = "fail"
        status_icon = "&#x274C;"
        status_text = f"{failed} Test(s) Failed"
    elif missing_coverage:
        status_class = "warn"
        status_icon = "&#x26A0;&#xFE0F;"
        status_text = "Tests Passed — Missing Coverage Detected"
    else:
        status_class = "pass"
        status_icon = "&#x2705;"
        status_text = "All Tests Passed"

    # Failed tests section
    failed_section = ""
    if jest_results.get("failed_tests"):
        rows = ""
        for i, t in enumerate(jest_results["failed_tests"], 1):
            title = _escape(" > ".join(t.get("title", [])))
            suite = _escape(t.get("suite", "unknown"))
            msg = ""
            if t.get("failure_messages"):
                msg = _escape(t["failure_messages"][0][:500])
            rows += f"""<tr>
  <td>{i}</td>
  <td><code>{suite}</code></td>
  <td><code>{title}</code></td>
  <td><div class="error-msg">{msg}</div></td>
</tr>
"""
        failed_section = f"""<h2 class="fail">&#x274C; Failed Test Details</h2>
<table>
<tr><th>#</th><th>Test Suite</th><th>Test Case</th><th>Error Message</th></tr>
{rows}
</table>"""

    # Missing coverage section
    missing_section = ""
    if missing_coverage:
        no_test_file = [m for m in missing_coverage if not m.get("has_test_file")]
        partial_coverage = [m for m in missing_coverage if m.get("has_test_file")]
        parts = []

        if no_test_file:
            rows = ""
            for m in no_test_file:
                exports_list = ", ".join(f'<code>{_escape(e["name"])}</code>' for e in m.get("all_exports", []))
                if not exports_list:
                    exports_list = "<em>none detected</em>"
                rows += f"""<tr>
  <td><code>{_escape(m["file"])}</code></td>
  <td>{exports_list}</td>
  <td><code>testcase/{_escape(m["expected_test"])}</code></td>
</tr>
"""
            parts.append(f"""<h2 class="warn">&#x26A0;&#xFE0F; Code Files With No Test File</h2>
<table>
<tr><th>Code File</th><th>Exported Items</th><th>Expected Test File</th></tr>
{rows}
</table>""")

        if partial_coverage:
            rows = ""
            for m in partial_coverage:
                for exp in m.get("untested_exports", []):
                    kind = exp.get("kind", "function")
                    badge_class = kind
                    rows += f"""<tr>
  <td><code>{_escape(m["file"])}</code></td>
  <td><code>{_escape(exp["name"])}</code></td>
  <td><span class="badge {badge_class}">{kind}</span></td>
</tr>
"""
            parts.append(f"""<h2 class="warn">&#x1F50D; Untested Exports</h2>
<p>These code files have a test file, but the following exports are not covered:</p>
<table>
<tr><th>Code File</th><th>Untested Export</th><th>Type</th></tr>
{rows}
</table>""")

        # All missing test cases summary
        all_untested = []
        for m in missing_coverage:
            for exp in m.get("untested_exports", []):
                all_untested.append({"file": m["file"], "export": exp})

        if all_untested:
            rows = ""
            for i, item in enumerate(all_untested, 1):
                kind = item["export"].get("kind", "function")
                rows += f"""<tr>
  <td>{i}</td>
  <td><code>{_escape(item["file"])}</code></td>
  <td><code>{_escape(item["export"]["name"])}</code></td>
  <td><span class="badge {kind}">{kind}</span></td>
</tr>
"""
            parts.append(f"""<h2>&#x1F4DD; Missing Test Cases</h2>
<p>The following exports in <code>coderep/</code> are <strong>not covered</strong> by any test in <code>testcase/</code>:</p>
<table>
<tr><th>#</th><th>Code File</th><th>Export</th><th>Type</th></tr>
{rows}
</table>""")

        missing_section = "\n".join(parts)

    # Fill template
    output = template.replace("{{STATUS_CLASS}}", status_class)
    output = output.replace("{{STATUS_ICON}}", status_icon)
    output = output.replace("{{STATUS_TEXT}}", status_text)
    output = output.replace("{{TOTAL}}", str(total))
    output = output.replace("{{PASSED}}", str(passed))
    output = output.replace("{{FAILED}}", str(failed))
    output = output.replace("{{SUITES}}", str(suites))
    output = output.replace("{{FAILED_SECTION}}", failed_section)
    output = output.replace("{{MISSING_COVERAGE_SECTION}}", missing_section)

    return output
