"""
Deploy the PR Test Validation dashboard to Netlify.

Usage:
    python -m app.deploy                   # Generate report + deploy to Netlify
    python -m app.deploy --generate-only   # Only generate HTML into dist/
    python -m app.deploy --site-id SITE_ID # Override Netlify site ID

Prerequisites:
    - npm install -g netlify-cli
    - Set NETLIFY_AUTH_TOKEN env var (or run `netlify login` first)
    - Set NETLIFY_SITE_ID env var (or pass --site-id)
    - Run Jest tests first to produce jest-results.json, OR have testcase/ and coderep/ folders
"""

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from app.report import parse_jest_results, find_missing_coverage
from app.report_html import generate_html_report


DIST_DIR = PROJECT_ROOT / "dist"
TESTCASE_DIR = PROJECT_ROOT / "testcase"
CODEREP_DIR = PROJECT_ROOT / "coderep"
JEST_RESULTS_FILE = PROJECT_ROOT / "jest-results.json"


def find_files(directory: Path, pattern: str) -> list[str]:
    """Find files matching a regex pattern under directory."""
    results = []
    if not directory.exists():
        return results
    for f in directory.rglob("*"):
        if f.is_file() and re.search(pattern, f.name):
            results.append(str(f.relative_to(PROJECT_ROOT)))
    return results


def read_file_contents(file_list: list[str]) -> dict[str, str]:
    """Read contents of files into a dict."""
    contents = {}
    root = PROJECT_ROOT
    for f in file_list:
        try:
            contents[f] = (root / f).read_text(encoding="utf-8")
        except (OSError, UnicodeDecodeError):
            contents[f] = ""
    return contents


def generate_report() -> str:
    """Generate the HTML report from local test results and source files."""
    # Parse Jest results
    jest_results = {"total": 0, "passed": 0, "failed": 0, "suites_total": 0, "suites_failed": 0, "failed_tests": [], "passed_tests": []}
    if JEST_RESULTS_FILE.exists():
        jest_raw = JEST_RESULTS_FILE.read_text(encoding="utf-8")
        jest_results = parse_jest_results(jest_raw)
    else:
        print("[info] jest-results.json not found — running with empty test results.")
        print("[info] Run `npx jest --json --outputFile=jest-results.json` first for full results.")

    # Find test and code files
    test_files = find_files(TESTCASE_DIR, r"\.(test|spec)\.(js|jsx|ts|tsx)$")
    code_files = find_files(CODEREP_DIR, r"\.(js|jsx|ts|tsx)$")

    print(f"[info] Found {len(test_files)} test file(s) in testcase/")
    print(f"[info] Found {len(code_files)} code file(s) in coderep/")

    # Read file contents for analysis
    test_contents = read_file_contents(test_files)
    code_contents = read_file_contents(code_files)

    # Find missing coverage
    missing = find_missing_coverage(test_files, code_files, test_contents=test_contents, code_contents=code_contents)

    # Generate HTML
    html_report = generate_html_report(jest_results, missing)
    return html_report


def deploy_to_netlify(site_id: str = None):
    """Deploy dist/ folder to Netlify."""
    cmd = ["npx", "netlify", "deploy", "--prod", "--dir", str(DIST_DIR)]

    if site_id:
        cmd.extend(["--site", site_id])
    elif os.environ.get("NETLIFY_SITE_ID"):
        cmd.extend(["--site", os.environ["NETLIFY_SITE_ID"]])

    print(f"[deploy] Running: {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode != 0:
        print(f"[error] Deploy failed:\n{result.stderr}")
        sys.exit(1)

    print(result.stdout)

    # Extract URL from output
    for line in result.stdout.splitlines():
        if "Website URL" in line or "https://" in line:
            print(f"[deploy] {line.strip()}")


def main():
    parser = argparse.ArgumentParser(description="Deploy PR Test Validation dashboard to Netlify")
    parser.add_argument("--generate-only", action="store_true", help="Only generate HTML, don't deploy")
    parser.add_argument("--site-id", help="Netlify site ID (or set NETLIFY_SITE_ID env var)")
    args = parser.parse_args()

    # Generate report
    print("[info] Generating HTML report...")
    html_report = generate_report()

    # Write to dist/
    if DIST_DIR.exists():
        shutil.rmtree(DIST_DIR)
    DIST_DIR.mkdir(parents=True)

    index_path = DIST_DIR / "index.html"
    index_path.write_text(html_report, encoding="utf-8")
    print(f"[info] Report written to {index_path}")

    if args.generate_only:
        print("[done] Generate-only mode. Open dist/index.html in your browser to view.")
        return

    # Deploy
    deploy_to_netlify(site_id=args.site_id)
    print("[done] Dashboard deployed successfully.")


if __name__ == "__main__":
    main()
