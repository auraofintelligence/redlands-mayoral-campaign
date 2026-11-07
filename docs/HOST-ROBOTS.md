# Shared-host crawler rules

The project's robots.txt does not control the shared GitHub Pages hostname. Merge the following path into the existing matching groups in the `auraofintelligence.github.io` repository. Preserve every unrelated directive. Avoid duplicate user-agent groups, which crawlers may combine unexpectedly.

```text
# In the existing User-agent: * group
Allow: /redlands-mayoral-campaign/

# In the existing OAI-SearchBot and Claude-SearchBot groups
Allow: /redlands-mayoral-campaign/

# In the existing GPTBot, ClaudeBot and Google-Extended groups
Disallow: /redlands-mayoral-campaign/

# Append alongside the existing sitemap declarations
Sitemap: https://auraofintelligence.github.io/redlands-mayoral-campaign/sitemap.xml
```

The preparation preview pages carry `noindex`. Crawler requests do not enforce licence terms or make private records safe to publish.
