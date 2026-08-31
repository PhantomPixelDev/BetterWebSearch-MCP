---
name: Bug Report
about: Report a bug to help us improve BetterWebSearch MCP
title: ''
labels: bug
assignees: ''
---

## Describe the bug

A clear and concise description of what the bug is.

## Steps to reproduce

1. Run `npx -y better-web-search-mcp` (or provide your exact command)
2. Send tool call with parameters '...'
3. See error / unexpected behaviour

## Expected behaviour

A clear and concise description of what you expected to happen.

## Actual behaviour

What actually happened. Include any error messages or unexpected output.

## Environment

- **Node version**: <!-- e.g. 20.11.0 (run `node --version`) — Node 20+ required -->
- **npm version**: <!-- e.g. 10.2.4 -->
- **OS**: <!-- e.g. Windows 11, macOS 14, Ubuntu 22.04 -->
- **MCP client**: <!-- e.g. Claude Desktop, Claude Code, Cursor, VS Code Copilot, OpenCode, other -->
- **Search provider used**: <!-- e.g. DuckDuckGo (keyless), Brave, Tavily — check stderr banner on startup -->

## Reproduction config

```bash
# Paste the exact command or MCP client config you used
npx -y better-web-search-mcp
```

```json
// Or paste your mcp.json / client config snippet (redact API keys!)
```

## Additional context

Add any other context, screenshots, or logs here. If the issue is related to search results or extraction, include the query and domain if possible.
