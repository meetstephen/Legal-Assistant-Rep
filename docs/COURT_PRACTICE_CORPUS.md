# State-specific court practice directions

The nationwide source directory is **not** a comprehensive collection of operative directions. The new library tracks all 36 states and FCT by eight procedure categories and exposes every missing category. A collected small-claims instrument does not fill ordinary High Court civil, criminal, appeal, ADR, service or electronic-procedure gaps.

## Collection and legal limitations

`scripts/practice-sources.json` identifies specific instruments and official-source URLs. `src/lexi/data/practiceCorpusIndex.json` records collection status, source PDF SHA-256, court scope, low-text pages and uncertainty. `public/practice-directions/*.json` contains page-addressable extraction snapshots; the app loads only selected documents, caches successful loads and bounds model evidence to approximately 14,000 characters.

The first collection includes actual small-claims texts for Abia, Anambra, Enugu, Imo, Benue, Delta, Katsina, Yobe and Borno; criminal/ACJL texts for Kaduna and Edo; civil and appeal directions for Gombe; and service/compendium texts for FCT. Ebonyi's official 2024 scanned instrument has separately transcribed page-image-checked excerpts covering scope, commencement, defence, service, reply, hearing/judgment targets and appeals. Its raw OCR is excluded from AI retrieval. These excerpts are not a substitute for the complete instrument and counsel review.

Other collected scans remain excluded until reviewed. Failed downloads remain explicit gaps. Imo's purported general-directives download returned the **same PDF bytes as its small-claims download** and is excluded from general-procedure retrieval. Gombe's ACJL copy requires identity review. Invalid TLS certificates are not bypassed. Download failure does not establish that directions do not exist.

**No document is labelled currently in force.** Collection is not signature authentication, legal accuracy certification, amendment verification or automatic monitoring. Confirm the signed applicable instrument, subsequent amendments, court designation, superior legislation/rules, event date and registry requirements before calculating deadlines or filing. PDF page numbers are file pages, not necessarily printed pagination.

## Retrieval safeguards

- Match explicit state and procedure category from the latest user turn. A debt claim alone does not select small claims.
- Do not retrieve neighboring states or substitute small-claims rules for ordinary High Court proceedings.
- Missing/failed/unreviewed text produces an evidence-gap instruction, not a memory fallback.
- Cite supplied document title, visible article/order and official PDF page link. Partial text can omit conditions or provisos; open the full PDF before reliance.
- Supplied corpus links are labelled collected evidence, not live source verification. Requested live research still fails if the provider returns no live source links.
- Model instructions require conditional analysis where current force is unconfirmed; this is a guardrail, not a guarantee against hallucination. Qualified Nigerian counsel must verify outputs.

## Updating the collection

1. Obtain the actual signed court-issued instrument, not a portal, announcement, forms-only download or source-directory summary. Check identity, issuing court, commencement, application and amendments.
2. Add a specific metadata record to `scripts/practice-sources.json`. Use `blockReason` to exclude mismatched copies. Keep `currentForce: not-confirmed` unless a separate defensible amendment-verification process is implemented.
3. Run `python scripts/build-practice-corpus.py` with `pypdf` installed. Cached PDFs and OCR images are local temporary review materials, not committed. When changing a URL, remove that instrument's cached PDF before rebuilding so old bytes cannot be attributed to a new source.
4. For Windows scans, optionally run `python scripts/ocr-court-document.py INSTRUMENT-ID` with `pypdfium2`, Pillow and Windows OCR available. Inspect original page images; do not mark OCR as reviewed merely because extraction succeeded. Page-image-checked verbatim excerpts belong in `scripts/reviewed-practice-excerpts.json`, with PDF page and a clear indication of omitted continuation/provisos.
5. Review generated snapshots, update notes, run lint/tests/build, and have counsel validate new procedural propositions. Never silently overwrite a reviewed source with an unrelated document.

More ordinary High Court and specialized directions are still needed, particularly Ebonyi and the other South-East states, as well as unfilled categories nationwide. The visible coverage table is the acquisition backlog; “no text collected” must never be represented as “no practice directions.”

