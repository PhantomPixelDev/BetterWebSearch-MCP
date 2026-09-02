import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function readJson(name: string): { version: string } {
  return JSON.parse(readFileSync(join(root, name), "utf8")) as {
    version: string;
  };
}

describe("scaffold", () => {
  it("runs the vitest harness", () => {
    expect(true).toBe(true);
  });
});

describe("manifest versions", () => {
  it("keeps mcp.json in step with package.json", () => {
    // The `version` lifecycle hook syncs these during `npm version`. This test
    // is the backstop: mcp.json sat at 0.1.0 while npm shipped 0.2.1, and
    // nothing caught it.
    expect(readJson("mcp.json").version).toBe(readJson("package.json").version);
  });
});
