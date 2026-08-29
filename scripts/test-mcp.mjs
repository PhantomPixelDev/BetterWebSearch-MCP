#!/usr/bin/env node
import { spawn } from "node:child_process";

import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const serverPath = join(dirname(fileURLToPath(import.meta.url)), "../dist/index.js");

const child = spawn("node", [serverPath], { stdio: ["pipe", "pipe", "pipe"] });

let out = "";
let err = "";
child.stdout.on("data", (d) => (out += d.toString()));
child.stderr.on("data", (d) => (err += d.toString()));

function send(msg) {
  child.stdin.write(JSON.stringify(msg) + "\n");
}

async function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

send({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "test", version: "1.0" } } });
await delay(400);
send({ jsonrpc: "2.0", method: "notifications/initialized" });
await delay(200);
send({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} });
await delay(800);

child.stdin.end();
await delay(400);
child.kill();

console.log("---STDERR (banner)---");
console.log(err.slice(0, 2000));
console.log("---STDOUT (responses)---");
console.log(out.slice(0, 8000));

// parse responses
try {
  const lines = out.split("\n").filter(Boolean);
  for (const line of lines) {
    const msg = JSON.parse(line);
    if (msg.id === 2) {
      console.log("\n---TOOLS FOUND---");
      const tools = msg.result?.tools ?? [];
      for (const t of tools) console.log(` - ${t.name}: ${t.description?.slice(0,80)}`);
      const names = tools.map((t) => t.name);
      const expected = ["web_search", "web_research", "deep_search", "web_extract", "web_find", "web_news"];
      const missing = expected.filter((n) => !names.includes(n));
      console.log("\nExpected:", expected.join(", "));
      console.log("Missing:", missing.length ? missing.join(", ") : "none ✓");
      process.exit(missing.length ? 1 : 0);
    }
  }
} catch (e) {
  console.error("parse error", e);
  process.exit(1);
}
