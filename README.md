# Luke Hayes for Redlands

Projects, music, public information and options for Redlands by Luke Nathan Hayes, based at Amity on Minjerribah / North Stradbroke Island.

<a href="https://auraofintelligence.github.io/redlands-mayoral-campaign/about.html"><img src="public/assets/press/luke-hayes-published-portrait.webp" alt="Luke Nathan Hayes" width="200" height="250" align="right"></a>

**[Open the website](https://auraofintelligence.github.io/redlands-mayoral-campaign/)** · [Explore the projects](https://auraofintelligence.github.io/redlands-mayoral-campaign/projects.html) · [GitHub Wiki](https://github.com/auraofintelligence/redlands-mayoral-campaign/wiki/Home)

Luke is exploring a possible Redlands mayoral campaign as one person supported by AI companions. The approach remains relaxed, serendipitous and self-directed. The site presents projects and choices for discussion, with each retaining its own purpose and decision-makers.

## Explore the site

| Page | What it offers |
| --- | --- |
| [Home](https://auraofintelligence.github.io/redlands-mayoral-campaign/) | Luke's portrait, local photography, featured projects, the Redlands dashboard and album artwork |
| [Projects](https://auraofintelligence.github.io/redlands-mayoral-campaign/projects.html) | 113 selected projects across 23 subjects, beginning with Redlands information and local community work, followed by wider systems and ideas |
| [Redlands ideas](https://auraofintelligence.github.io/redlands-mayoral-campaign/ideas.html) | Connections between household costs, community capability and long-term planning |
| [GitHub Wiki](https://github.com/auraofintelligence/redlands-mayoral-campaign/wiki/Home) | 52 introduced ideas, a first-visit guide, words and names, practical examples, council responsibilities, related projects and source references |
| [About Luke](https://auraofintelligence.github.io/redlands-mayoral-campaign/about.html) | Background and links to the Open Record, work history, Project Atlas and Strange But True |
| [Music](https://auraofintelligence.github.io/redlands-mayoral-campaign/music.html) | A Protopian Gambit: 22 songs, topic summaries, project connections, landscape and portrait players, and lyrics |
| [Media](https://auraofintelligence.github.io/redlands-mayoral-campaign/media.html) | Downloadable media kit, portrait, factual biographies, press notes and interview topics |
| [Contact](https://auraofintelligence.github.io/redlands-mayoral-campaign/contact.html) | Public enquiry form with a mail-only handler and verified inbox delivery; the destination address stays private |
| [Site map](https://auraofintelligence.github.io/redlands-mayoral-campaign/sitemap.html) | Routes through the public pages and project collection |

Project descriptions explain the actual work in each source. Related projects have a labelled reason for their connection. Published project websites are the main destinations where available. Owner-requested exclusions keep private, archived and omitted work out of the selected public catalogue.

## Redlands sovereign capacity

Begin with **[Joyful Responsible Abundance](https://auraofintelligence.github.io/joyful-responsible-abundance/index.html)**. It connects personal agency, health, learning, useful work, public evidence and shared computing with the means to shape decisions.

The [Redlands sovereign-capacity proposal](https://github.com/auraofintelligence/redlands-mayoral-campaign/wiki/44-redlands-sovereign-capacity-for-the-age-of-superintelligence) applies that direction locally and explains the roles of council, communities, business, neighbouring councils and state and federal government. The [Sovereign Capacity Lab](https://auraofintelligence.github.io/sovereign-capacity-lab/index.html) provides the related research and scenario tools. Computing, civic places, cultural intelligence nodes, materials, energy, manufacturing and repair retain their distinct roles.

[Redlands Coast Intelligence](https://auraofintelligence.github.io/Redlands_draft_ES2026-2031/) opens with a populated Core dashboard. Its dated indicators link to their sources, alongside direct routes to council minutes, budgets, YouTube and meeting recordings.

## A Protopian Gambit

Luke writes the lyrics and uses generative AI to create music as **i C. infinity**. He has four completed albums and does not currently perform the music live. A Protopian Gambit contains **22 songs**, spanning EDM and house, pop, rock, cultural, reggae and coastal styles.

Each song has a quick topic summary and links to represented projects. **Eye of the Ancestors** is a dirge for Constance, Luke's gran, who died nine days before TC Alfred crossed the coast. It imagines the cyclone carrying her into the next place as its eye passes over Amity, connecting the storm's eye with ancestral memory.

The [9 November 2026 lyric sheet](https://auraofintelligence.github.io/redlands-mayoral-campaign/assets/music/a-protopian-gambit-lyric-sheet-2026-11-09.pdf) contains 22 songs across 29 pages. Strange but True has moved to the fifth album, **Straddie Fun**, which is a work in progress.

**Severe language warning:** Don't Try to Fix Me is an angry song about big tech. The site asks for acknowledgement before loading that song, either complete playlist, or the full lyric sheet.

[Listen and read on this site](https://auraofintelligence.github.io/redlands-mayoral-campaign/music.html) · [Published album](https://auraofintelligence.github.io/i-C-infinity-music-universe/albums/a-protopian-gambit/) · [Music Universe](https://auraofintelligence.github.io/i-C-infinity-music-universe/)

## Private command centre

The outreach command centre and working records have been separated into the **private** repository `auraofintelligence/redlands-mayoral-command-centre`. This repository publishes only the public campaign pages and source Wiki. Running `npm run control` belongs to the separate private repository, not this public site.

## Build and preview

Requires **Node.js 20 or later**. No runtime package installation is required.

```sh
npm run check
npm run preview
```

The static preview is available at [127.0.0.1:4173](http://127.0.0.1:4173/). The build generates the public site in `dist/` and the versioned native GitHub Wiki pages in `docs/wiki/`. The wiki has its own Git repository and is published separately. GitHub Actions checks and publishes `dist/` to GitHub Pages after updates to `main`.

## Source layout

| Path | Purpose |
| --- | --- |
| `data/visual-content.json` | Selected public projects, proposal entries and shared context |
| `data/wiki-wording-*.json` | Public proposal wording, preserved separately from the private working map |
| `data/visual-music.json` | Album sequence, song summaries, project links and lyrics |
| `data/visual-profile.json` | Luke's factual biography, public source links and interview topics |
| `public/assets/` | Optimised credited images, bitmap favicon, fonts, music resources and browser code |
| `scripts/` | Website and Wiki generation, local preview and release checks |
| `docs/wiki/` | Markdown for the actual GitHub Wiki |
| `integrations/contact-form/` | Public contact form integration source |
| `tests/` | Behaviour, source, privacy and publication-boundary checks |
| `dist/` | Generated public site, never a source-editing location |

Only allowlisted public output is published. The original supplied documents and private working map remain separate. Source checks are described in the [source audit](docs/SOURCE-AUDIT.md).

## Presentation, status and rights

The site uses P4A's purple and gold palette, full-width local photography, Luke's published portrait, unique project covers and a generated raster favicon. Real photographs, project screenshots and GenAI illustrations are labelled and credited. Navigation includes Previous, Next, a floating Top control, footer links and the site map.

The current publication mode is **campaign preparation preview**. The authoriser name is recorded; the address remains omitted at Luke's direction and authorisation is incomplete. Election requirements and official dates can be checked with the [Electoral Commission of Queensland](https://www.ecq.qld.gov.au/). The configuration retains official references separately from Luke's choices.

Original work follows the [Strange But True Public Source Licence](LICENCE.md). Photographs, fonts and linked work retain their own rights. Read the [image credits](https://auraofintelligence.github.io/redlands-mayoral-campaign/credits.html) before reuse. This is public source. The [host-root robots notes](docs/HOST-ROBOTS.md) explain crawler preferences on the shared GitHub Pages hostname.

Updated **9 November 2026**, Australia/Brisbane.
