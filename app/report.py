import json
import re
from pathlib import PurePosixPath


def parse_jest_results(jest_output: str) -> dict:
    """Parse Jest JSON output into structured results."""
    try:
        data = json.loads(jest_output)
    except json.JSONDecodeError:
        return {"error": "Failed to parse Jest output", "raw": jest_output}

    failed_tests = []
    passed_tests = []

    for suite in data.get("testResults", []):
        suite_name = suite.get("name", "unknown")
        for test in suite.get("assertionResults", []):
            entry = {
                "suite": PurePosixPath(suite_name).name,
                "title": test.get("ancestorTitles", []) + [test.get("title", "")],
                "status": test.get("status"),
            }
            if test.get("status") == "failed":
                entry["failure_messages"] = test.get("failureMessages", [])
                failed_tests.append(entry)
            else:
                passed_tests.append(entry)

    return {
        "total": data.get("numTotalTests", 0),
        "passed": data.get("numPassedTests", 0),
        "failed": data.get("numFailedTests", 0),
        "suites_total": data.get("numTotalTestSuites", 0),
        "suites_failed": data.get("numFailedTestSuites", 0),
        "failed_tests": failed_tests,
        "passed_tests": passed_tests,
    }


def find_missing_coverage(test_files: list[str], code_files: list[str]) -> list[dict]:
    """Identify code files in coderep/ that have no corresponding test in testcase/."""
    test_basenames = set()
    for tf in test_files:
        name = PurePosixPath(tf).stem
        name = re.sub(r"\.(test|spec)$", "", name)
        test_basenames.add(name.lower())

    missing = []
    for cf in code_files:
        path = PurePosixPath(cf)
        if path.suffix not in (".js", ".jsx", ".ts", ".tsx"):
            continue
        stem = path.stem.lower()
        if stem == "index":
            stem = path.parent.name.lower()
        if stem not in test_basenames:
            missing.append({"file": cf, "expected_test": f"{path.stem}.test{path.suffix}"})

    return missing


def generate_test_report(jest_results: dict, missing_coverage: list[dict]) -> str:
    """Generate a markdown report of test validation results."""
    parts = []

    if "error" in jest_results:
        parts.append("### Jest Execution Error")
        parts.append(f"```\n{jest_results.get('raw', jest_results['error'])}\n```")
        return "\n\n".join(parts)

    total = jest_results["total"]
    passed = jest_results["passed"]
    failed = jest_results["failed"]

    if failed == 0 and not missing_coverage:
        status = "All tests passed"
    elif failed > 0:
        status = f"{failed} test(s) failed"
    else:
        status = "All tests passed (but missing coverage detected)"

    parts.append(f"### Test Results: {status}")
    parts.append(
        f"| Metric | Count |\n|--------|-------|\n"
        f"| Total Tests | {total} |\n"
        f"| Passed | {passed} |\n"
        f"| Failed | {failed} |\n"
        f"| Test Suites | {jest_results['suites_total']} |\n"
        f"| Failed Suites | {jest_results['suites_failed']} |"
    )

    if jest_results["failed_tests"]:
        parts.append("### Failed Tests")
        for t in jest_results["failed_tests"]:
            title = " > ".join(t["title"])
            parts.append(f"- **{t['suite']}**: `{title}`")
            if t.get("failure_messages"):
                msg = t["failure_messages"][0][:500]
                parts.append(f"  ```\n  {msg}\n  ```")

    if missing_coverage:
        parts.append("### Missing Test Coverage")
        parts.append(
            "The following code files in `coderep/` have no corresponding test file in `testcase/`:"
        )
        for m in missing_coverage:
            parts.append(f"- `{m['file']}` — expected: `{m['expected_test']}`")

    return "\n\n".join(parts)
