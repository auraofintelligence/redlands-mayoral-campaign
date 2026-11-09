# Luke's Redlands projects, music and command centre

The visual home page introduces the reviewed project collection, Redlands ideas, Luke's background, music and media resources. The 125 selected project pages each have a credited raster image and their own source-checked description. The detailed working map is now a 52-entry [GitHub Wiki](https://github.com/auraofintelligence/redlands-mayoral-campaign/wiki/Home), with versioned Markdown source in `docs/wiki/` and shared role, connection and source-reference pages. Owner-requested public exclusions are recorded separately from the original private working map.

The outreach command centre remains available at `outreach.html`. Existing browser-local working records keep their existing storage identity. Personal policy wording, notes, private documents and source-machine paths are excluded from the visual site and wiki projection.

The site uses P4A's purple and gold palette, full-width real Redlands photography, credited project artwork and clearly labelled generated subject illustrations. The new favicon is a generated bitmap, supplied as PNG and ICO. The music page includes A Protopian Gambit in landscape and portrait, song lyrics, the dated lyric sheet and a severe-language acknowledgement for Don't Try to Fix Me.

[Open the command centre](https://auraofintelligence.github.io/redlands-mayoral-campaign/) or go straight to the [Outreach desk](https://auraofintelligence.github.io/redlands-mayoral-campaign/outreach.html#outreach).

A control room for choosing a direction, discovering Redlands election media and commentary, following public sources, and saving possibilities. Luke Nathan Hayes uses it with AI companions at his own pace. It starts with no assigned work, invented activity or personal schedule.

The primary view connects discovery with a working outreach desk. Each source has a Prepare outreach action. It opens a draft contact record with the verified public route and source attached. Luke can save a subject, message and notes, reopen the same record, copy a draft and record whether he is exploring, drafting, has contacted someone, received a reply or parked the idea. Preparing or copying does not send a message or change the conversation stage.

Floating Previous, Top and Next controls follow the sidebar order. A section change returns to the top; filtering or editing within the same section preserves position. Media and commentators groups media records by category and shows 12 results at a time, with combined search and filters. Community, university and union records have their own directories. The footer links to Strange But True and Luke's Open Record.

Direct directories cover [local podcasts and creators](https://auraofintelligence.github.io/redlands-mayoral-campaign/outreach.html#new-media), [national political podcasts](https://auraofintelligence.github.io/redlands-mayoral-campaign/outreach.html#national-podcasts), [women-focused media](https://auraofintelligence.github.io/redlands-mayoral-campaign/outreach.html#women-media), [music shows and podcasts](https://auraofintelligence.github.io/redlands-mayoral-campaign/outreach.html#music), [university networks](https://auraofintelligence.github.io/redlands-mayoral-campaign/outreach.html#university), [Redlands community networks](https://auraofintelligence.github.io/redlands-mayoral-campaign/outreach.html#community-networks) and [media and commentators](https://auraofintelligence.github.io/redlands-mayoral-campaign/outreach.html#media). Listings have public channels, evidence and checked dates. A listing does not mean the source has covered this election, endorsed Luke or agreed to receive messages.

The local podcast and creator view focuses on South East Queensland, with region and format filters. National interviews and women-focused publications have separate views. Community networks identify local clubs, associations, centres and groups through their own public channels. Example episodes and articles are labelled separately from verified coverage of the current Redland election.

Women-focused discovery includes Australian banter, relationships, culture and current-events podcasts, with topic and area filters. Music discovery offers genre, area and format filters, recorded-music submission information and explicit notes about published or unverified AI policies. Luke has four albums; A Protopian Gambit is complete. He wrote the lyrics, used generative AI to make the music and does not currently perform it live. University networks include student publications, societies and official club directories, with campus scope and participation details.

[Workers' unions](https://auraofintelligence.github.io/redlands-mayoral-campaign/outreach.html#unions) lists Queensland branches, their industries, public publications and contact routes. Community networks now includes Probus clubs, chambers of commerce and Indigenous organisations. Existing organisations retain one record when appearing in several views.

Luke's approach is relaxed and serendipitous. He can explore, save an idea, draft something, choose a date or leave it open. The earlier mention of **11 November 2026** is retained only as a tentative option. No campaign launch or personal timetable is declared by this repository.

## Open the control room

Requires Node.js 20 or later. No runtime package installation is required.

```sh
npm run control
```

Open [the local control room](http://127.0.0.1:4183/). The publicly hosted interface uses browser-local storage for personal choices. Those records stay with that browser and origin; they do not automatically synchronise with the local CLI or Google Drive. Use the interface's storage and export controls to see the actual mode and keep a copy of work you want to retain.

The workspace provides media discovery, saved possibilities, optional dates, connections, drafts, enquiries, the source library, AI exploration prompts, resources and a personal activity trail. It does not send messages or create schedules automatically.

## Visual pages, wiki and outreach

The visual site starts at `index.html`. It links the illustrated project catalogue, Redlands ideas, reference wiki, About Luke, music, media kit, contact form and site map. The outreach explorer is at `outreach.html`. Legacy public reference pages remain available for existing links.

```sh
npm run check
npm run preview
```

The static preview runs at [the public-artifact preview](http://127.0.0.1:4173/). The build publishes only `dist/`. Private runtime records and credentials are excluded.

Current campaign publication mode is a preparation preview. Luke is exploring a possible mayoral campaign. No certified nomination is claimed. The authoriser name is recorded, while the address remains omitted at Luke's direction and authorisation remains incomplete. A preview label does not establish compliance or a decision to launch.

## Optional administration

The local CLI is available when Luke wants structured private records:

```sh
npm run ops -- init
npm run ops -- status
npm run ops -- template tasks
```

Initialisation creates an empty store when needed and preserves existing records. It adds no tasks, contacts, dates or approvals. Undated examples in `operations/bootstrap.mjs` are optional templates, not assigned work.

Read [workspace and storage notes](docs/OPERATIONS.md), [working with AI companions](docs/AGENT-OPERATING-MODEL.md) and [optional next directions](docs/LAUNCH-RUNBOOK.md) as reference material. None creates a daily routine or publishing obligation.

Google Drive and contact-form integration source is included. A connected account or created folder is not proof of a deployed Apps Script portal, working public intake or automatic synchronisation. The new contact page uses the [mail-only endpoint](integrations/contact-mail/README.md) when a verified deployment is configured. The earlier [Drive intake](docs/CONTACT-FORM.md) and [Google Drive setup](docs/GOOGLE-DRIVE.md) remain separate. Record successful inbox verification before claiming delivery is connected.

## Where things live

| Path | Purpose |
| --- | --- |
| `control-room/` | Primary election explorer and personal workspace |
| `data/` | Public configuration and source-backed directories |
| `public/` | Public photographs, fonts, favicon and browser assets |
| `scripts/` | Public build, preview and release checks |
| `operations/` | Optional local private records and undated examples |
| `integrations/google-drive/` | Separate Apps Script integration source |
| `docs/` | Reference guides, source audit and setup notes |
| `tests/` | Behaviour and publication-boundary checks |
| `private/` | Ignored runtime records, never commit or publish |
| `dist/` | Generated public artifact |

Browser-local storage is not a private account system. Keep sensitive correspondence, personal contacts, receipts and identity information out of the public browser workspace and public GitHub. The restricted local store and any verified private Drive deployment are separate storage choices.

## Sources and rights

The [source audit](docs/SOURCE-AUDIT.md) explains the curated project collection and pinned provenance. Original source projects retain their own status. Public proposals, working tools, creative work and prototypes are not automatically campaign policies.

The command centre uses [P4A's](https://p4a.xyz/) deep purple, violet, amethyst and gold palette with a full-width Redlands photograph. Luke's [Outreach CMS](https://auraofintelligence.github.io/outreach-cms/) informs usable page content and workflows. Real Redlands photographs carry photographer, date, source and Creative Commons credits. Original repository material follows [the Strange But True Public Source Licence](LICENCE.md); photographs, fonts and third-party work retain their own terms. This is public source, not an open-source licence.

The project `robots.txt` records crawler preferences. Only the shared hostname's root robots file controls crawling on GitHub Pages. [Host-root notes](docs/HOST-ROBOTS.md) describe the scoped update. Crawler signals are not access control.

## Official dates are reference information

ECQ's announcement describes a full postal Redland mayoral by-election on **12 December 2026**, with the election notice and nominations opening on **10 November 2026**. These are external election dates, not Luke's personal schedule. Nomination closing time, expenditure cap and postal-return details remain unset until verified from the official notice.

Sources checked 8 November 2026: [ECQ announcement](https://www.ecq.qld.gov.au/media/2026-media-statements), [candidate information](https://www.ecq.qld.gov.au/election-participants/local-election-participants/candidates) and [authorisation guidance](https://www.ecq.qld.gov.au/_resource/documents/pdf/election-participants/handbooks,-fact-sheet-and-forms/local/fact-sheets/LG-Fact-sheet-03-Authorisation-of-election-material-v.-Mar-26.pdf).
