# Nationwide jurisdiction review

All 36 states and the FCT now have specific options, separate from federal-law scope. Legal Analysis Skill (all seven modes), AI Assistant/document actions/follow-ups, both research modes, profile/admin defaults, State Rules and the court checklist use the same jurisdiction labels. Legacy FCT labels are normalized in selectors. There is no Lagos drafting fallback.

Matter jurisdiction, court/forum, judicial division and law-as-at date are explicit inputs. Profile defaults do not establish the forum. Substantive governing law and cross-border compliance scope remain separate. Changing matter scope clears/cancels the earlier result so follow-ups cannot silently reuse another state's analysis.

Evidence retrieval honors an explicitly selected territory rather than a party's address or a precedent mentioning another state. The territorial practice-direction corpus is not substituted for federal-court rules. Generic scope instructions do not inject unrelated criminal or small-claims categories.

The State Rules reference is a verification checklist for every jurisdiction, not an assertion that an older edition is current. The Constitution distinguishes territorial courts and FCT arrangements: [issuing court's Constitution publication](https://www.fcthighcourt.gov.ng/wp-content/uploads/2022/01/Nigeria_Constitution_1999_en.pdf), sections 270–274, 299–301. This historical publication is not treated as a complete current consolidated amendment source.

NBA branch names are free-text actual membership/receipt names. A partial city list no longer excludes branches or assigns Lagos by default. This is not a fabricated directory of branches or a claim that each state has only one branch.

Tools' Deadline Calculator no longer chooses a state's limitation period from a general table. It needs a specific jurisdiction, precise counsel-confirmed period, triggering date, recorded source/provision and confirmation before calculating a provisional calendar date. Source entry is not independent verification; working-day rules, exclusions, exceptions and extensions still need counsel review.

## Coverage limits

This change does **not** claim complete verified law or practice directions for every state. Existing collected court texts, identity exclusions and category gaps remain intact. Signed gazettes, current statutes/rules, amendments, commencement and court scope must be established for the relevant event dates. Source-only research now refuses to fill missing material from model memory.

Other reference tables and Court Diary's legacy limitation/procedural templates still require a separate verified-source and date-arithmetic audit; do not treat those template values as state-specific law. Dependency security warnings also remain outside this jurisdiction-focused change.

## Checks

Regression tests cover all 37 territorial choices, rule-reference completeness, legacy FCT aliases, court/scope mismatches, federal-court retrieval exclusions, governing-law defaults, primary analysis/research UI and incomplete limitation inputs. Full CI runs tests, ESLint, the court-corpus integrity checker and the production build.

