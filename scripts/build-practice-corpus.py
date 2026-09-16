"""Build page-addressable court-direction snapshots from a curated source manifest.

Run manually after reviewing sources. Never infers current force or invents missing text.
Dependencies: pypdf; optional Windows OCR uses the accompanying PowerShell script.
"""
import argparse
import concurrent.futures
import hashlib
import io
import json
from pathlib import Path
import urllib.parse
import urllib.request
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
MAX_BYTES = 25 * 1024 * 1024


def ingest(doc, cache):
    item = dict(doc, extractionStatus="unavailable", pages=[], pageCount=0)
    try:
        source = cache / (doc["id"] + ".pdf")
        if not source.exists():
            request = urllib.request.Request(doc["url"], headers={"User-Agent": "LegalAssistant-SourceReview/1.0"})
            with urllib.request.urlopen(request, timeout=25) as response:
                # Reject cross-host redirects instead of silently importing unexpected material.
                if urllib.parse.urlparse(response.url).hostname != urllib.parse.urlparse(doc["url"]).hostname:
                    raise ValueError("Cross-host redirect requires source review")
                raw = response.read(MAX_BYTES + 1)
            if len(raw) > MAX_BYTES or not raw.startswith(b"%PDF-"):
                raise ValueError("Not a PDF or exceeds 25 MiB")
            source.write_bytes(raw)
        raw = source.read_bytes()
        reader = PdfReader(io.BytesIO(raw))
        pages = [{"page": i + 1, "text": p.extract_text() or "", "method": "pdf-text"} for i, p in enumerate(reader.pages)]
        ocr = cache / (doc["id"] + ".ocr.json")
        if ocr.exists():
            reviewed_pages = json.loads(ocr.read_text(encoding="utf-8-sig"))
            for p in pages:
                if len(p["text"].strip()) < 100:
                    replacement = next((v for v in reviewed_pages if v["page"] == p["page"]), None)
                    if replacement:
                        p.update(text=replacement["text"], method="windows-ocr")
        item.update(sha256=hashlib.sha256(raw).hexdigest(), pageCount=len(pages), pages=pages)
        excerpts_file = ROOT / "scripts" / "reviewed-practice-excerpts.json"
        excerpts = json.loads(excerpts_file.read_text(encoding="utf-8")).get(doc["id"], [])
        item["reviewedExcerpts"] = excerpts
        readable = [p for p in pages if len(p["text"].strip()) >= 100]
        identity = " ".join(p["text"] for p in pages[:10]).lower()
        identity_terms = [doc["state"].lower()]
        if doc["state"] == "FCT":
            identity_terms.append("federal capital territory")
        item["ocrUsed"] = any(p["method"] == "windows-ocr" for p in pages)
        if doc.get("blockReason"):
            item["extractionStatus"] = "identity-review-required"
            item["extractionNote"] = doc["blockReason"]
        elif item["ocrUsed"] and not doc.get("ocrVisualReviewed"):
            item["extractionStatus"] = "reviewed-excerpts" if excerpts else "scan-needs-review"
            item["extractionNote"] = "Raw OCR excluded from AI retrieval. Only the separately transcribed, page-image-checked excerpts may be used." if excerpts else "OCR extracted but not visually reviewed. Do not retrieve until reviewed against page images."
        elif readable and not any(term in identity for term in identity_terms):
            item["extractionStatus"] = "identity-review-required"
            item["extractionNote"] = "Expected state not found on first ten pages. Do not retrieve this text until reviewed."
        elif len(readable) < max(1, len(pages) // 2):
            item["extractionStatus"] = "scan-needs-review"
            item["extractionNote"] = "Insufficient text coverage. Scanned/blank pages require OCR and visual review."
        else:
            item["extractionStatus"] = "text-available"
            item["extractionNote"] = "Extracted page text is NOT confirmation of signature, commencement, current force or legal accuracy."
        item["emptyPages"] = [p["page"] for p in pages if len(p["text"].strip()) < 100]
    except Exception as exc:
        item["extractionNote"] = str(exc)[:220]
    print(doc["id"], item["extractionStatus"], item["pageCount"], flush=True)
    return item


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--cache", type=Path, default=ROOT / "tmp" / "court-sources")
    args = parser.parse_args()
    args.cache.mkdir(parents=True, exist_ok=True)
    manifest = json.loads((ROOT / "scripts" / "practice-sources.json").read_text(encoding="utf-8"))
    out = ROOT / "public" / "practice-directions"
    out.mkdir(parents=True, exist_ok=True)
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
        docs = list(pool.map(lambda d: ingest(d, args.cache), manifest))
    index = []
    for doc in docs:
        (out / (doc["id"] + ".json")).write_text(json.dumps(doc, ensure_ascii=False), encoding="utf-8")
        index.append({k: v for k, v in doc.items() if k != "pages"})
    data_dir = ROOT / "src" / "lexi" / "data"
    data_dir.mkdir(exist_ok=True)
    (data_dir / "practiceCorpusIndex.json").write_text(json.dumps(index, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()

