"""Optional local Windows OCR for a downloaded public court PDF, never model-generated text."""
import argparse
import json
from pathlib import Path
import subprocess
import pypdfium2 as pdfium

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument("id")
args = parser.parse_args()
cache = root / "tmp" / "court-sources"
pdf = pdfium.PdfDocument(cache / (args.id + ".pdf"))
for i, page in enumerate(pdf):
    image = page.render(scale=2).to_pil()
    image.thumbnail((2200, 2200))
    image.save(cache / (args.id + "-" + str(i + 1).zfill(3) + ".png"))
helper = str(root / "scripts" / "ocr-court-pages.ps1").replace("'", "''")
folder = str(cache).replace("'", "''")
prefix = args.id.replace("'", "''")
command = "& ([scriptblock]::Create([IO.File]::ReadAllText('" + helper + "'))) -Folder '" + folder + "' -Prefix '" + prefix + "'"
result = subprocess.run(["powershell", "-NoProfile", "-Command", command], capture_output=True, check=True)
pages = json.loads(result.stdout.decode("utf-8-sig"))
(cache / (args.id + ".ocr.json")).write_text(json.dumps(pages, ensure_ascii=False), encoding="utf-8")
print(args.id, len(pages), "pages OCR extracted; visual/source review still required")

