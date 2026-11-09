# Public and private separation review

Reviewed 9 November 2026, Australia/Brisbane.

The public repository presents Luke, projects, music, media resources, contact and ideas for Redlands. The command centre, discovery directories, planning, outreach and working records belong in the separate private repository.

## Findings and corrections

| Finding | Correction |
| --- | --- |
| The earlier page generator still created a second set of public pages with planning and browser-storage descriptions. | The visual publisher now owns all public pages. Earlier campaign, calendar and transparency URLs lead to current public information, with the current design and navigation. |
| The homepage script redirected old workspace hash bookmarks to the removed outreach page. | Removed that redirect. Those bookmarks remain on the public home and do not read, change or delete browser records. |
| The old downloadable brief said no portrait had been supplied. | The old download URL now serves the current media fact sheet. The media kit, biographies, portrait, album artwork and licence were checked against their current source files. |
| Contact integration source and tests still described Drive-file intake, while the website uses a mail handler. | Aligned the public integration, manifest, tests and guide with the existing mail-only handler. No live Google deployment, permissions or mail delivery was changed by this review. |
| Agent instructions referenced a removed operating-model file and retained private directory instructions. | Updated them for public website work and the current project catalogue. |
| A source-preparation helper required private working files absent from a fresh public checkout. | Removed that obsolete helper. The website and native Wiki build from committed public snapshots without private records. |
| The initial source-audit notes described the public site as an election explorer. | Labelled the initial pinned register and current 113-project catalogue separately, and corrected the current public role. |
| GitHub's About description still called this repository an outreach command centre. | Updated the description to identify the public project website, Wiki, music and media resources. Existing relevant public-project topics are retained. |

Publication notes now appear in the site map and footer. The current site preserves its project order, all 113 project pages, 52 Wiki ideas, music, portraits, image credits and contact form. Legitimate references to the separate Worldwide Contact System project remain; they are not links to the removed campaign command centre.

## Checks

`npm run check` passed all 24 checks. It builds the public site and 59 native Wiki files, then checks page and anchor links, publication boundaries, imagery, music, contact handling and the specific migration failures above. The output allowlist names public pages explicitly. Old bookmark behaviour is exercised without accessing browser records. The former outreach app and its data are excluded from the build. Browser verification confirmed that an old outreach bookmark stays on the public home and the earlier transparency URL opens the current publication notes.

The mail tests exercise a simulated provider and send no messages. The archive check compares media-kit content with current public press files; differences in text line endings do not change their wording. Google hosting and final email delivery require separate verification and are not established by these checks.

This review covers the current source and generated public output. It does not rewrite older public Git commits, clear browser storage or remove historical downloads and caches.
