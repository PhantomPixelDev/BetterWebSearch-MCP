import { describe, expect, it } from "vitest";

import {
  BlockedUrlError,
  assertPublicUrl,
  isBlockedAddress,
  isBlockedIpv4,
  isBlockedIpv6,
} from "./ssrf.js";

const publicResolve = { resolve: async () => ["93.184.216.34"] };

describe("isBlockedIpv4", () => {
  it.each([
    ["127.0.0.1", "loopback"],
    ["127.255.255.254", "loopback range edge"],
    ["10.0.0.1", "RFC1918 /8"],
    ["172.16.0.1", "RFC1918 /12 start"],
    ["172.31.255.255", "RFC1918 /12 end"],
    ["192.168.1.1", "RFC1918 /16"],
    ["169.254.169.254", "cloud metadata"],
    ["100.64.0.1", "carrier-grade NAT"],
    ["0.0.0.0", "unspecified"],
    ["255.255.255.255", "broadcast"],
    ["224.0.0.1", "multicast"],
  ])("blocks %s (%s)", (address) => {
    expect(isBlockedIpv4(address)).toBe(true);
  });

  it.each([
    ["93.184.216.34"],
    ["8.8.8.8"],
    ["1.1.1.1"],
    ["172.15.255.255"], // just below the RFC1918 /12
    ["172.32.0.0"], // just above the RFC1918 /12
  ])("allows public address %s", (address) => {
    expect(isBlockedIpv4(address)).toBe(false);
  });

  it("treats an unparseable address as blocked", () => {
    expect(isBlockedIpv4("not.an.ip.addr")).toBe(true);
    expect(isBlockedIpv4("999.1.1.1")).toBe(true);
  });
});

describe("isBlockedIpv6", () => {
  it.each([["::1"], ["::"], ["fc00::1"], ["fd00::1"], ["fe80::1"], ["ff02::1"]])(
    "blocks %s",
    (address) => {
      expect(isBlockedIpv6(address)).toBe(true);
    },
  );

  it("allows a public v6 address", () => {
    expect(isBlockedIpv6("2606:2800:220:1:248:1893:25c8:1946")).toBe(false);
  });

  it("judges IPv4-mapped addresses by their v4 rules", () => {
    // ::ffff:127.0.0.1 would otherwise sail past the v6 prefix checks.
    expect(isBlockedIpv6("::ffff:127.0.0.1")).toBe(true);
    expect(isBlockedIpv6("::ffff:10.0.0.1")).toBe(true);
    expect(isBlockedIpv6("::ffff:93.184.216.34")).toBe(false);
  });

  it("ignores a zone index", () => {
    expect(isBlockedIpv6("fe80::1%eth0")).toBe(true);
  });
});

describe("isBlockedAddress", () => {
  it("dispatches on address family", () => {
    expect(isBlockedAddress("10.0.0.1")).toBe(true);
    expect(isBlockedAddress("::1")).toBe(true);
    expect(isBlockedAddress("8.8.8.8")).toBe(false);
  });
});

describe("assertPublicUrl", () => {
  it("accepts a public https URL", async () => {
    await expect(
      assertPublicUrl("https://example.com/page", publicResolve),
    ).resolves.toBeUndefined();
  });

  it.each([
    ["file:///etc/passwd", "file scheme"],
    ["data:text/html,<h1>x</h1>", "data scheme"],
    ["ftp://example.com/", "ftp scheme"],
  ])("rejects %s (%s)", async (url) => {
    await expect(assertPublicUrl(url, publicResolve)).rejects.toBeInstanceOf(
      BlockedUrlError,
    );
  });

  it("rejects localhost and its subdomains without DNS", async () => {
    await expect(assertPublicUrl("http://localhost/")).rejects.toBeInstanceOf(
      BlockedUrlError,
    );
    await expect(
      assertPublicUrl("http://api.localhost/"),
    ).rejects.toBeInstanceOf(BlockedUrlError);
  });

  it("rejects a literal private address without DNS", async () => {
    await expect(assertPublicUrl("http://192.168.0.1/")).rejects.toBeInstanceOf(
      BlockedUrlError,
    );
  });

  it("rejects a bracketed IPv6 loopback", async () => {
    await expect(assertPublicUrl("http://[::1]:8080/")).rejects.toBeInstanceOf(
      BlockedUrlError,
    );
  });

  it("rejects a name resolving to any non-public address", async () => {
    // A split-horizon name returning one public and one private record must
    // not pass: we do not get to choose which address the socket uses.
    await expect(
      assertPublicUrl("https://split.example/", {
        resolve: async () => ["93.184.216.34", "127.0.0.1"],
      }),
    ).rejects.toBeInstanceOf(BlockedUrlError);
  });

  it("rejects a name that fails to resolve", async () => {
    await expect(
      assertPublicUrl("https://nx.example/", {
        resolve: async () => {
          throw new Error("ENOTFOUND");
        },
      }),
    ).rejects.toBeInstanceOf(BlockedUrlError);
  });

  it("rejects a name that resolves to nothing", async () => {
    await expect(
      assertPublicUrl("https://empty.example/", { resolve: async () => [] }),
    ).rejects.toBeInstanceOf(BlockedUrlError);
  });

  it("rejects a malformed URL", async () => {
    await expect(assertPublicUrl("not a url")).rejects.toBeInstanceOf(
      BlockedUrlError,
    );
  });

  it("names the offending address in the message", async () => {
    await expect(
      assertPublicUrl("http://169.254.169.254/"),
    ).rejects.toThrow(/169\.254\.169\.254/);
  });
});
