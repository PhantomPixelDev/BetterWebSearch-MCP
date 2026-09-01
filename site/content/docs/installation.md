---
title: "Installation"
description: "Install BetterWebSearch MCP via npx, npm, or from source. Requirements: Node 20+."
weight: 15
---

## Requirements

- **Node.js 20+** and **npm**
- No API keys required — DuckDuckGo works out of the box

## Install via npx (no install)

```bash
npx -y better-web-search-mcp --help   # keyless — DuckDuckGo works immediately
npx -y better-web-search-mcp          # start MCP stdio server
```

## Install globally

```bash
npm i -g better-web-search-mcp
better-web-search-mcp --help
better-web-search-mcp --version
```

## Install from source

```bash
git clone https://github.com/PhantomPixelDev/BetterWebSearch-MCP.git
cd BetterWebSearch-MCP
npm ci
npm run build
npm test            # 189+ tests, keyless suite
npx tsc --noEmit    # lint
```

## Native binding note

`better-sqlite3` needs a compiled native addon. If it fails to load (older Node, missing build tools, CI sandbox), the cache automatically falls back to an in-memory Map — no action needed. To restore the SQLite cache, run `npm rebuild better-sqlite3` (Node 20+ recommended).

## MCP client configs

All configs are keyless — add `env` only if you have a key. The same `command` + `args` pattern works for **Claude Desktop, Claude Code, Cursor, VS Code Copilot, Windsurf, OpenCode**, and any MCP stdio client.

### Local build

```json
{
  "mcpServers": {
    "better-web-search-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/BetterWebSearch-MCP/dist/index.js"]
    }
  }
}
```

### OpenCode (`opencode.json`)

```json
{
  "mcp": {
    "better-web-search-mcp": {
      "type": "local",
      "command": ["npx", "-y", "better-web-search-mcp"],
      "enabled": true
    }
  }
}
```

### Smithery

```bash
npx @smithery/cli install better-web-search-mcp  # if published
# or point at this repo's smithery.yaml
```

### VS Code Copilot (`.vscode/mcp.json` already included)

VS Code reads `.vscode/mcp.json` → `servers.better-web-search-mcp`. No extra setup.

### Claude Code CLI

```bash
claude mcp add better-web-search-mcp -- npx -y better-web-search-mcp
claude mcp add better-web-search-mcp --env BRAVE_API_KEY=... -- npx -y better-web-search-mcp
```

## Manual smoke test (no keys)

```bash
npm run build
npx tsx scripts/smoke.mjs              # hits keyless search + extract
BRAVE_API_KEY= npx tsx scripts/smoke.mjs  # proves missing-key warning, not crash
node dist/index.js --help
```

## CLI

```bash
better-web-search-mcp --help      # prints usage + env + examples
better-web-search-mcp --version   # prints semver
better-web-search-mcp             # start stdio server (banner to stderr)
```

`--help` and `--version` exit before connecting, so they never interfere with MCP handshakes.

## Available scripts

| Script | Description |
|---|---|
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run dev` | Watch mode with `tsx` |
| `npm test` | Run all tests with Vitest |
| `npm run lint` | Type-check with `tsc --noEmit` |
| `npm run check:publish` | Dry-run pack to see what ships to npm |
| `npm run version:patch` | Bump patch version and tag |
| `npm run release:patch` | Version bump, publish, and push tags |

## Publishing to npm (maintainers)

```bash
# 1. Stay on main, working tree clean
npm run lint && npm test && npm run build

# 2. Bump version (updates package.json + CHANGELOG + git tag)
npm run version:patch   # or version:minor / version:major
# Manually add entry to CHANGELOG.md, then:
git add CHANGELOG.md && git commit --amend --no-edit

# 3. Publish (requires `npm login`)
npm publish --access public
# or: npm run release:patch   # does version:patch + publish + git push --follow-tags

# 4. Push + create GitHub Release (auto via .github/workflows/release.yml on tag v*.*.*)
git push --follow-tags
# CI also runs: .github/workflows/ci.yml on every push
```

### Publish via GitHub Actions (Trusted Publishing, recommended)

Push a tag `v0.1.1` and `release.yml` runs `npm publish --provenance --access public` using OIDC Trusted Publishing. No long-lived npm token stored as a secret.

One-time setup on npmjs.org:

1. Open npmjs.com, go to your account, Access Tokens, Trusted Publishers.
2. Add new publisher with:
   - Provider: GitHub
   - Repository: `PhantomPixelDev/BetterWebSearch-MCP`
   - Workflow: `release.yml`
   - Environment: (leave blank)
3. Save. No `NPM_TOKEN` secret is needed in GitHub.

npm provenance requires the GitHub repository to be public so the OIDC attestation can be verified.
