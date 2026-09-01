# Contributing to BetterWebSearch MCP

Thank you for considering a contribution! This guide covers setup, development workflow, and the pull-request process.

## Quick start

```bash
# 1. Fork and clone
git clone https://github.com/<your-username>/BetterWebSearch-MCP.git
cd BetterWebSearch-MCP

# 2. Install dependencies
npm ci

# 3. Build
npm run build

# 4. Run the test suite
npm test          # 189+ tests — fully keyless

# 5. Type-check (lint)
npm run lint      # tsc --noEmit — must be zero errors
```

### Keyless by default

BetterWebSearch works out of the box — no API keys needed. DuckDuckGo is always on. The test suite uses deterministic mocks and never requires external keys. If you want to exercise live providers locally, copy `.env.example` to `.env` and fill in the keys you have:

| Variable | Purpose |
|---|---|
| `BRAVE_API_KEY` | Brave Search API (better ranking & recency) |
| `TAVILY_API_KEY` | Tavily Search API |
| `SERPAPI_KEY` | SerpApi (reserved for future provider) |
| `BETTER_WEB_SEARCH_DISABLE_CACHE` | Set `true` for in-memory cache (no SQLite) |
| `BETTER_WEB_SEARCH_CACHE_PATH` | Custom SQLite path (default `data/cache.db`) |
| `BETTER_WEB_SEARCH_DISABLE_BROWSER` | Set `true` to skip Playwright fallback |

All of these are **optional** — never commit a `.env` file with real keys.

## Development

- **Node 20+** is required (`engines` in `package.json`).
- **TypeScript** with strict mode — no `any`, no `@ts-ignore`.
- **Vitest** for tests — run `npm test` or `npx vitest run`.
- **Playwright** powers the browser extraction tier; tests use mocks so you don't need a browser installed to run the suite.
- The SQLite cache (`better-sqlite3`) falls back to an in-memory Map automatically if the native binding is unavailable.

### Project structure

```
src/
  index.ts          # CLI entry point (MCP stdio server)
  tools/            # MCP tool definitions (zod schemas)
  providers/        # SearchProvider implementations (Brave, Tavily, DuckDuckGo)
  extraction/       # 3-tier extraction: HTTP → hydration → Playwright
  utils/            # Config, cache, dedup, rerank helpers
scripts/            # Postinstall checks, smoke test
dist/               # Compiled output (gitignored)
data/               # Runtime SQLite cache (gitignored)
```

## Branching strategy

- **`main`** — stable, always releasable.
- **`feat/<topic>`** — new features.
- **`fix/<topic>`** — bug fixes.
- **`docs/<topic>`** — documentation-only changes.

Create your branch from the latest `main`:

```bash
git checkout main && git pull
git checkout -b feat/my-feature
```

## Pull request checklist

Before opening a PR, make sure every box is checked:

- [ ] `npm run lint` — zero errors
- [ ] `npm test` — all 189+ tests pass
- [ ] `npm run build` — `dist/` compiles cleanly
- [ ] New/changed functionality has tests
- [ ] Types are explicit — no `any` or `@ts-ignore`
- [ ] `CHANGELOG.md` updated (Keep a Changelog format)
- [ ] `npm pack --dry-run` — tarball looks correct
- [ ] No secrets, API keys, or `.env` values committed

### Commit messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(extraction): add cache-based domain learning
fix(providers): handle DuckDuckGo rate-limit gracefully
docs: update CONTRIBUTING with PR checklist
chore(deps): bump playwright to 1.48
```

## Reporting bugs

Open an issue using the **Bug Report** template. Include:

1. Steps to reproduce
2. Expected vs actual behavior
3. Node version (`node --version`)
4. Which search provider you were using (keyless / Brave / Tavily)

## Requesting features

Open an issue using the **Feature Request** template. Describe the problem you're trying to solve, your proposed solution, and any alternatives you considered.

## Security disclosures

If you discover a security vulnerability, **do not open a public issue.** Instead, please follow the process described in [SECURITY.md](SECURITY.md).

## Code of conduct

This project follows the [Contributor Covenant v2.1](CODE_OF_CONDUCT.md). By participating, you agree to uphold its standards.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
