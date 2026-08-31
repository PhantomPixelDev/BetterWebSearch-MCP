# Task 5 — Scaffold Hugo docs site for GitHub Pages

**Date:** 2026-08-31
**Plan:** `.omo/plans/public-launch-github-npm-website.md` todo 5

## Summary

Scaffolded a Hugo static site at `site/` using the **Blowfish** theme (added as a git submodule). The site builds cleanly with `hugo --source site --gc --minify` (exit 0), producing `site/public/index.html`, `sitemap.xml`, `robots.txt`, and `index.json` with the correct GitHub Pages project baseURL.

## Hugo version

```
hugo v0.161.1 windows/amd64 BuildDate=unknown
```

## Files created

- `site/config.toml` — baseURL, title, theme, enableRobotsTXT, canonifyURLs, params, goldmark unsafe, outputs
- `site/content/_index.md` — homepage stub (hero + quickstart + tools table)
- `site/archetypes/default.md` — default content archetype
- `site/static/favicon.svg` — placeholder favicon
- `site/themes/blowfish` — git submodule (nunocoracao/blowfish)
- `.gitignore` — added `site/public/`, `site/resources/`, `.hugo_build.lock`

## Submodule status

```
 775a91a63aa983515351fd3110323d1d85270735 site/themes/blowfish (v3.5.0-7-g775a91a6)
```

## Config verification (grep)

```
baseURL = "https://phantompixeldev.github.io/BetterWebSearch-MCP/"
title = "BetterWebSearch MCP"
theme = "blowfish"
enableRobotsTXT = true
canonifyURLs = true
unsafe = true
```

## Build log

```
Start building sites …
hugo v0.161.1 windows/amd64 BuildDate=unknown

WARN  Module "blowfish" is not compatible with this Hugo version: 0.162.0/0.165.0 extended; run "hugo mod graph" for more information.

                  │ EN
──────────────────┼────
 Pages            │ 10
 Paginator pages  │  0
 Non-page files   │  0
 Static files     │  8
 Processed images │  0
 Aliases          │  0
 Cleaned          │  0

Total in 647 ms
EXITCODE=0
```

> Note: The single WARN is a non-fatal module compatibility notice (Blowfish declares support for Hugo 0.162/0.165 extended; local is 0.161.1). Build succeeds with exit 0.

## Output verification

- `site/public/index.html` — exists, contains `<title>BetterWebSearch MCP</title>` and canonical URL `https://phantompixeldev.github.io/BetterWebSearch-MCP/`
- `site/public/sitemap.xml` — exists
- `site/public/robots.txt` — exists
- `site/public/index.json` — exists (search index)

## Acceptance criteria

- [x] `ls site/config.toml site/content/_index.md site/themes/blowfish` — all exist
- [x] `grep -q "phantompixeldev.github.io/BetterWebSearch-MCP" site/config.toml` — passes
- [x] `hugo --source site --gc --minify` — exits 0
- [x] `git submodule status | grep blowfish` — shows blowfish submodule
- [x] `.gitignore` contains `site/public/`, `site/resources/`, `.hugo_build.lock`

## Guardrails respected

- `site/public` NOT committed (gitignored)
- Theme CSS NOT committed — submodule only
- Existing workflows NOT modified
