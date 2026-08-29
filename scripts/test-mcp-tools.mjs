#!/usr/bin/env node
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const serverPath = join(dirname(fileURLToPath(import.meta.url)), "../dist/index.js");
const child = spawn("node", [serverPath], { stdio: ["pipe", "pipe", "pipe"] });
let outBuf = "";
let errBuf = "";
child.stdout.on("data", (d) => (outBuf += d.toString()));
child.stderr.on("data", (d) => (errBuf += d.toString()));
function send(obj) { child.stdin.write(JSON.stringify(obj) + "\n"); }
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
const pending = new Map();
let nextId = 1;
function call(method, params) {
  return new Promise((resolve) => {
    const id = nextId++;
    pending.set(id, resolve);
    send({ jsonrpc: "2.0", id, method, params });
  });
}
child.stdout.on("data", () => {
  const lines = outBuf.split("\n");
  outBuf = lines.pop() ?? "";
  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const msg = JSON.parse(line);
      if (msg.id && pending.has(msg.id)) {
        pending.get(msg.id)(msg);
        pending.delete(msg.id);
      }
    } catch {}
  }
});
await delay(300);
console.log("Initializing...");
await call("initialize", { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "test", version: "1.0" } });
send({ jsonrpc: "2.0", method: "notifications/initialized" });
await delay(300);
console.log("Testing web_search keyless...");
const r1 = await call("tools/call", { name: "web_search", arguments: { query: "opencode mcp tutorial", max_results: 3 } });
console.log("web_search result preview:", JSON.stringify(r1.result ?? r1.error, null, 2).slice(0, 3000));
console.log("\nTesting web_extract keyless...");
const r2 = await call("tools/call", { name: "web_extract", arguments: { urls: ["https://example.com"], mode: "auto" } });
console.log("web_extract result preview:", JSON.stringify(r2.result ?? r2.error, null, 2).slice(0, 4000));
console.log("\nTesting web_find...");
const r3 = await call("tools/call", { name: "web_find", arguments: { query: "authentication", site: "laravel.com", max_results: 2 } });
console.log("web_find result preview:", JSON.stringify(r3.result ?? r3.error, null, 2).slice(0, 3000));
child.stdin.end();
await delay(500);
child.kill();
console.log("\n---STDERR banner---");
console.log(errBuf.slice(0, 1500));
console.log("\n=== DONE ===");
