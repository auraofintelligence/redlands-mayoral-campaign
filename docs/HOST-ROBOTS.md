# Shared-host crawler rules

Updated 10 November 2026 for Redlands Civic Lab. Luke is not contesting the mayoral by-election.

The tracked [project policy copy](../public/robots.txt) is copied unchanged into the website build. It is available at [the project's robots.txt address](https://auraofintelligence.github.io/redlands-mayoral-campaign/robots.txt).

The effective file for all projects on this GitHub Pages hostname is [the host-root robots.txt](https://auraofintelligence.github.io/robots.txt), maintained in the separate `auraofintelligence.github.io` repository. The Redlands project path has been added to its existing matching crawler groups, with unrelated directives preserved. No new robots index format is needed: the host-root file includes the project's sitemap directly.

```text
# In the existing User-agent: * group
Allow: /redlands-mayoral-campaign/

# In the existing OAI-SearchBot and Claude-SearchBot groups
Allow: /redlands-mayoral-campaign/

# In the existing GPTBot, ClaudeBot and Google-Extended groups
Disallow: /redlands-mayoral-campaign/

# Listed alongside the existing sitemap declarations
Sitemap: https://auraofintelligence.github.io/redlands-mayoral-campaign/sitemap.xml
```

The current civic pages permit indexing. Search discovery is allowed; the named training crawlers are asked not to collect the project. These crawler preferences grant no commercial or political reuse permission. The [existing licence](../LICENCE.md), linked projects' terms and third-party rights remain separate from crawler rules.

Google documents the [root-location requirement and sitemap directives](https://developers.google.com/search/docs/crawling-indexing/robots/create-robots-txt) and the [limits of crawler controls](https://developers.google.com/search/docs/crawling-indexing/robots/intro). Crawler requests rely on cooperation and are not access controls. The private command centre is excluded from publication, rather than protected by robots.txt.
