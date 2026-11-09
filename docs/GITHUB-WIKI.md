# GitHub Wiki publication

The public reference edition belongs in the [repository’s GitHub Wiki](https://github.com/auraofintelligence/redlands-mayoral-campaign/wiki). It is separate from the visual GitHub Pages site and from private working records.

`node scripts/build-github-wiki.mjs` prepares the public Markdown in `docs/wiki/` from `data/visual-content.json`. It preserves all 52 entry IDs, every nonempty narrative field, music relationships, published project websites, official references, supplied document titles and connections. This includes strategic purpose, first-principles foundation, local uses, personal leadership examples and health/research connections where present. Generation fails if a narrative field is omitted. Home, mayoral-role context, source registers, a sidebar and a footer support browsing. Links use GitHub Wiki page URLs without `.md`; connection headings retain their original titles for GitHub’s heading anchors.

The preparer reads only repository data. It does not read private files, send messages, change repository settings or publish remotely. Excluded projects and private fields must stay outside the public snapshot. Running the website build alone does not publish the Wiki.

GitHub stores Wiki pages in a separate Git repository:

```text
https://github.com/auraofintelligence/redlands-mayoral-campaign.wiki.git
```

GitHub requires an initial page to be saved on its website before that repository can be cloned. Once Home exists, clone the Wiki to an ignored working folder, such as `private/github-wiki/`. Read the remote history and current pages before copying files. Copy only the prepared `docs/wiki/*.md` files, review the diff, commit with the existing author identity and push to the Wiki’s default branch. Preserve unrelated existing Wiki pages and use a normal push, never a force push.

After publishing, verify the remote commit matches the local commit and check Home, an entry, the sidebar and the reference pages through their public URLs. Do not report publication from local files or a successful clone alone.

Official GitHub guidance: [Adding or editing wiki pages](https://docs.github.com/en/communities/documenting-your-project-with-wikis/adding-or-editing-wiki-pages) and [Editing wiki content](https://docs.github.com/en/communities/documenting-your-project-with-wikis/editing-wiki-content).
