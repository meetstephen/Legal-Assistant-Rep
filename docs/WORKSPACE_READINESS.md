# Workspace readiness changes

## Court Diary

Legacy limitation categories and procedural checklists retain their identifiers, but no longer supply unverified periods or triggering events as nationwide law. The standalone calculator uses counsel-confirmed jurisdiction, provision, period and trigger inputs. It is calendar arithmetic, not independent legal verification.

Existing procedural dates without review metadata are retained as `legacyDueDate`, displayed as unverified, and excluded from overdue counts. A procedural due date becomes active only after a user records the court/jurisdiction, operative provision/order and counsel-calculated date, then explicitly confirms review. Changing the court or court location invalidates prior procedural reviews. Historical source data is not silently deleted.

Limitation categories now require review rather than automatic countdowns. Record a reviewed limitation date and its reasoning in matter notes; this change does not certify a nationwide limitation library. Working days, time-of-service, exceptions, tolling, transitional provisions and court orders require counsel review.

## Saved Library

Practice > Saved Library opens saved analyses/drafts and document templates. Search includes titles, body text and categories, with matter/type filters. Global search opens the actual saved item. AI results preserve search-linked sources when saved and include those links in exports. Downloaded files are not automatically uploaded or indexed. Unsaved chat output is not silently archived.

## Print and Word

Word output is now a genuine `.docx` file, not HTML named `.doc`. Exports use readable black serif typography, consistent margins, structured headings, bullets and tables, repeated table headers and a plain disclaimer. Banking details are no longer automatically included in legal advice exports. The supported Markdown subset is intentionally limited; unknown syntax remains text.

PDF uses the browser print dialog: choose Save as PDF. Popup blocking downloads printable HTML instead, with an explicit notice. Browser print headers/footers are controlled by the user’s print settings.

A generated DOCX fixture passed text round-trip checks, including currency, table content and source URLs. Visual rendering remains unverified in this workspace: the bundled LibreOffice renderer is absent and the browser runtime failed to initialise. Inspect representative long documents in Word and print preview before public launch.

## Dependencies and email

Vite and Vitest have been upgraded to patched major versions and the lockfile refreshed. The audit at implementation reported zero known vulnerabilities; this is not a guarantee against future advisories. Vite requires Node 20.19+ or 22.12+; CI uses the latest Node 22 and blocks high/critical dependency advisories.

Public authentication email still requires owner-configured SMTP. See [public email setup](PUBLIC_AUTH_EMAIL.md). No provider account, sender domain or SMTP credentials have been created/configured.
