---
title: "Contributing"
description: "How to contribute to BetterWebSearch MCP — setup, development workflow, and pull-request process."
weight: 95
---

Thank you for considering a contribution! Please see the full [Contributing Guide](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/main/CONTRIBUTING.md) on GitHub for detailed instructions.

## Quick start

```bash
git clone https://github.com/PhantomPixelDev/BetterWebSearch-MCP.git
cd BetterWebSearch-MCP
npm ci
npm run build
npm test          # 189+ tests — fully keyless
npm run lint      # tsc --noEmit — must be zero errors
```

## Key points

- **Keyless by default** — no API keys needed to develop or test
- **Node 20+** required
- **TypeScript strict** — no `any`, no `@ts-ignore`
- **Vitest** for tests — deterministic mocks, no external keys
- **Conventional Commits** — `feat(extraction): ...`, `fix(providers): ...`, `docs: ...`

## PR checklist

- [ ] `npm run lint` — zero errors
- [ ] `npm test` — all 189+ tests pass
- [ ] `npm run build` — `dist/` compiles cleanly
- [ ] New functionality has tests
- [ ] Types are explicit — no `any` or `@ts-ignore`
- [ ] `CHANGELOG.md` updated
- [ ] `npm pack --dry-run` — tarball looks correct
- [ ] No secrets, API keys, or `.env` values committed

## Security

If you discover a security vulnerability, **do not open a public issue.** Follow the process in [SECURITY.md](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/main/SECURITY.md).

## Code of conduct

This project follows the [Contributor Covenant v2.1](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/main/CODE_OF_CONDUCT.md). By participating, you agree to uphold its standards.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/main/LICENSE).
