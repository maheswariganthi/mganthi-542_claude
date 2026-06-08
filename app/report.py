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


def extract_exports_from_code(file_path: str, content: str) -> list[dict]:
    """Extract exported functions, components, and constants from a React/JS file."""
    exports = []

    # export default function/class ComponentName
    for m in re.finditer(r'export\s+default\s+(?:function|class)\s+(\w+)', content):
        exports.append({"name": m.group(1), "type": "default", "kind": "component", "file": file_path})

    # export default ComponentName (variable reference)
    for m in re.finditer(r'export\s+default\s+(\w+)\s*;', content):
        exports.append({"name": m.group(1), "type": "default", "kind": "component", "file": file_path})

    # export function/const named exports
    for m in re.finditer(r'export\s+(?:const|let|var|function)\s+(\w+)', content):
        name = m.group(1)
        kind = "component" if name[0].isupper() else "function"
        exports.append({"name": name, "type": "named", "kind": kind, "file": file_path})

    # Arrow function components: const ComponentName = () => { ... }
    # Only if not already captured as export
    for m in re.finditer(r'(?:export\s+)?const\s+(\w+)\s*=\s*(?:\([^)]*\)|[a-zA-Z_]\w*)\s*=>', content):
        name = m.group(1)
        if name[0].isupper() and not any(e["name"] == name for e in exports):
            exports.append({"name": name, "type": "named", "kind": "component", "file": file_path})

    # React.memo / React.forwardRef wrapped components
    for m in re.finditer(r'(?:export\s+)?const\s+(\w+)\s*=\s*(?:React\.)?(?:memo|forwardRef)\(', content):
        name = m.group(1)
        if not any(e["name"] == name for e in exports):
            exports.append({"name": name, "type": "named", "kind": "component", "file": file_path})

    # Custom hooks: export function useXxx or export const useXxx
    for m in re.finditer(r'export\s+(?:const|function)\s+(use[A-Z]\w+)', content):
        name = m.group(1)
        if not any(e["name"] == name for e in exports):
            exports.append({"name": name, "type": "named", "kind": "hook", "file": file_path})

    return exports


def extract_tested_items(file_path: str, content: str) -> list[dict]:
    """Extract what's being tested from a Jest test file (describe/it/test blocks and imports)."""
    tested = []

    # Imports from coderep — captures what's being tested
    for m in re.finditer(r"import\s+(?:\{([^}]+)\}|(\w+))\s+from\s+['\"]([^'\"]+)['\"]", content):
        named_imports = m.group(1)
        default_import = m.group(2)
        source = m.group(3)
        if named_imports:
            for name in re.split(r'\s*,\s*', named_imports):
                name = name.strip().split(' as ')[0].strip()
                if name:
                    tested.append({"name": name, "source": source, "file": file_path})
        if default_import:
            tested.append({"name": default_import, "source": source, "file": file_path})

    # describe('ComponentName', ...) or describe("ComponentName", ...)
    for m in re.finditer(r"describe\s*\(\s*['\"]([^'\"]+)['\"]", content):
        tested.append({"name": m.group(1), "source": "describe", "file": file_path})

    # test('should do X') or it('should do X') — capture test descriptions
    for m in re.finditer(r"(?:test|it)\s*\(\s*['\"]([^'\"]+)['\"]", content):
        tested.append({"name": m.group(1), "source": "test", "file": file_path})

    return tested


def find_missing_coverage(test_files: list[str], code_files: list[str],
                          test_contents: dict = None, code_contents: dict = None) -> list[dict]:
    """Identify code files and exports in coderep/ that have no corresponding test coverage."""
    test_contents = test_contents or {}
    code_contents = code_contents or {}

    # Collect all tested names from test files
    all_tested_names = set()
    for tf in test_files:
        content = test_contents.get(tf, "")
        items = extract_tested_items(tf, content)
        for item in items:
            all_tested_names.add(item["name"].lower())

    # Also match by file basename
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

        has_test_file = stem in test_basenames
        content = code_contents.get(cf, "")
        exports = extract_exports_from_code(cf, content)

        # Find untested exports
        untested_exports = []
        for exp in exports:
            if exp["name"].lower() not in all_tested_names:
                untested_exports.append(exp)

        if not has_test_file:
            missing.append({
                "file": cf,
                "expected_test": f"{path.stem}.test{path.suffix}",
                "has_test_file": False,
                "untested_exports": untested_exports,
                "all_exports": exports,
            })
        elif untested_exports:
            missing.append({
                "file": cf,
                "expected_test": f"{path.stem}.test{path.suffix}",
                "has_test_file": True,
                "untested_exports": untested_exports,
                "all_exports": exports,
            })

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

    # --- Failed Tests Section ---
    if jest_results["failed_tests"]:
        parts.append("### :x: Failed Tests")
        for t in jest_results["failed_tests"]:
            title = " > ".join(t["title"])
            parts.append(f"- **{t['suite']}**: `{title}`")
            if t.get("failure_messages"):
                msg = t["failure_messages"][0][:500]
                parts.append(f"  ```\n  {msg}\n  ```")

    # --- Missing Coverage Section ---
    if missing_coverage:
        no_test_file = [m for m in missing_coverage if not m.get("has_test_file")]
        partial_coverage = [m for m in missing_coverage if m.get("has_test_file")]

        if no_test_file:
            parts.append("### :warning: Code Files With No Test File")
            parts.append(
                "The following code files in `coderep/` have **no corresponding test file** in `testcase/`:\n"
            )
            parts.append("| Code File | Exported Items | Suggested Test File |")
            parts.append("|-----------|---------------|-------------------|")
            for m in no_test_file:
                exports_str = ", ".join(f"`{e['name']}`" for e in m["all_exports"]) or "_none detected_"
                parts.append(f"| `{m['file']}` | {exports_str} | `testcase/{m['expected_test']}` |")

        if partial_coverage:
            parts.append("### :mag: Untested Exports (Test File Exists But Coverage Is Incomplete)")
            parts.append(
                "These code files have a test file, but the following exports are **not covered**:\n"
            )
            for m in partial_coverage:
                parts.append(f"**`{m['file']}`**")
                for exp in m["untested_exports"]:
                    parts.append(f"- `{exp['name']}` ({exp['kind']})")

        # --- Suggested Missing Test Cases ---
        parts.append("### :memo: Suggested Missing Test Cases")
        parts.append(
            "The following test cases should be added to improve coverage:\n"
        )
        parts.append("| # | Code File | Export | Type | Suggested Test |")
        parts.append("|---|-----------|--------|------|---------------|")
        count = 0
        for m in missing_coverage:
            for exp in m.get("untested_exports", []):
                count += 1
                if exp["kind"] == "component":
                    suggestion = f"renders `{exp['name']}` without crashing"
                elif exp["kind"] == "hook":
                    suggestion = f"calls `{exp['name']}` and validates return value"
                else:
                    suggestion = f"calls `{exp['name']}` with valid args and checks output"
                parts.append(
                    f"| {count} | `{m['file']}` | `{exp['name']}` | {exp['kind']} | {suggestion} |"
                )

        if count == 0:
            parts.pop()  # remove table header
            parts.pop()
            parts.pop()
            parts.pop()

    return "\n\n".join(parts)
