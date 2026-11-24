"""Build a self-contained copy of the explorer in one HTML file.

Usage:
    python scripts/build_data_js.py      # if anything in data/ changed
    python scripts/build_single_file.py

Inlines d3, the data bundle and the runtime into dist/rmg01-explorer.html, so the whole explorer
is one file to email or drop in a shared drive. Only the web fonts still come from Google Fonts;
without a connection the page falls back to system fonts.
"""
from pathlib import Path

root = Path(__file__).resolve().parent.parent
html = (root / "index.html").read_text()

for path in ["vendor/d3.min.js", "data/data.js", "js/runtime.js"]:
    tag = f'<script src="{path}"></script>'
    assert tag in html, f"missing {tag}"
    code = (root / path).read_text().replace("</script", "<\\/script")
    html = html.replace(tag, "<script>\n" + code + "\n</script>", 1)

out = root / "dist" / "rmg01-explorer.html"
out.parent.mkdir(exist_ok=True)
out.write_text(html)
print(f"Wrote {out} ({out.stat().st_size / 1e6:.1f} MB)")
