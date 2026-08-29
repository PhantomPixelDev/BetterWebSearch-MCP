import { describe, expect, it, vi } from "vitest";

import {
  discoverApiPatterns,
  installApiCapture,
  type ApiResponse,
  type CapturePage,
} from "./apiIntercept.js";

/** Build a fake Playwright response object. */
function fakeResponse(
  url: string,
  method: string,
  contentType: string,
  data: unknown,
): ApiResponse {
  return {
    url: () => url,
    request: () => ({ method: () => method }),
    headers: () => ({ "content-type": contentType }),
    json: async () => data,
  };
}

/** Build a fake Playwright page that records its listeners. */
function fakePage(): CapturePage & {
  listeners: Array<(r: ApiResponse) => void>;
} {
  const listeners: Array<(r: ApiResponse) => void> = [];
  return {
    listeners,
    on: (_event, listener) => {
      listeners.push(listener);
    },
    off: (_event, listener) => {
      const idx = listeners.indexOf(listener);
      if (idx !== -1) {
        listeners.splice(idx, 1);
      }
    },
  };
}

describe("installApiCapture", () => {
  it("captures JSON responses with url/method/contentType/data", async () => {
    const page = fakePage();
    const handle = installApiCapture(page);

    const listener = page.listeners[0] as (r: ApiResponse) => void;
    await listener(
      fakeResponse(
        "https://api.example.com/products/123",
        "GET",
        "application/json; charset=utf-8",
        { id: 123 },
      ),
    );

    expect(handle.captured).toHaveLength(1);
    expect(handle.captured[0]).toMatchObject({
      url: "https://api.example.com/products/123",
      method: "GET",
      contentType: "application/json; charset=utf-8",
      data: { id: 123 },
    });
  });

  it("ignores non-JSON content types", async () => {
    const page = fakePage();
    const handle = installApiCapture(page);

    const listener = page.listeners[0] as (r: ApiResponse) => void;
    await listener(
      fakeResponse("https://example.com/style.css", "GET", "text/css", "body{}"),
    );

    expect(handle.captured).toHaveLength(0);
  });

  it("skips JSON responses whose body fails to parse", async () => {
    const page = fakePage();
    const handle = installApiCapture(page);

    const listener = page.listeners[0] as (r: ApiResponse) => void;
    const bad = fakeResponse(
      "https://api.example.com/broken",
      "GET",
      "application/json",
      { id: 1 },
    );
    bad.json = async () => {
      throw new Error("parse failed");
    };
    await listener(bad);

    expect(handle.captured).toHaveLength(0);
  });

  it("remove() detaches the listener", async () => {
    const page = fakePage();
    const handle = installApiCapture(page);
    expect(page.listeners).toHaveLength(1);

    handle.remove();

    expect(page.listeners).toHaveLength(0);
  });
});

describe("discoverApiPatterns", () => {
  it("normalizes numeric path segments to *", () => {
    const rows = discoverApiPatterns("example.com", [
      {
        url: "https://example.com/api/products/123",
        method: "GET",
        contentType: "application/json",
        data: {},
      },
    ]);

    expect(rows).toEqual([
      {
        domain: "example.com",
        endpoint_pattern: "/api/products/*",
        method: "GET",
        content_type: "application/json",
      },
    ]);
  });

  it("deduplicates identical method+pattern pairs", () => {
    const rows = discoverApiPatterns("example.com", [
      {
        url: "https://example.com/api/products/123",
        method: "GET",
        contentType: "application/json",
        data: {},
      },
      {
        url: "https://example.com/api/products/456",
        method: "GET",
        contentType: "application/json",
        data: {},
      },
    ]);

    expect(rows).toHaveLength(1);
  });

  it("keeps distinct methods as separate patterns", () => {
    const rows = discoverApiPatterns("example.com", [
      {
        url: "https://example.com/api/products/123",
        method: "GET",
        contentType: "application/json",
        data: {},
      },
      {
        url: "https://example.com/api/products/123",
        method: "POST",
        contentType: "application/json",
        data: {},
      },
    ]);

    expect(rows).toHaveLength(2);
  });

  it("strips parameters from the content type", () => {
    const rows = discoverApiPatterns("example.com", [
      {
        url: "https://example.com/api/items",
        method: "GET",
        contentType: "application/json; charset=utf-8",
        data: {},
      },
    ]);

    expect(rows[0]?.content_type).toBe("application/json");
  });

  it("skips malformed URLs", () => {
    const rows = discoverApiPatterns("example.com", [
      {
        url: "not a url",
        method: "GET",
        contentType: "application/json",
        data: {},
      },
    ]);

    expect(rows).toHaveLength(0);
  });
});
