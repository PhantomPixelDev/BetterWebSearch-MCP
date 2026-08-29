import { describe, expect, it } from "vitest";

import { extractStructuredData } from "./structured.js";

describe("extractStructuredData", () => {
  it("extracts JSON-LD and unwraps @graph", () => {
    const html = `
      <script type="application/ld+json">
        {"@context":"https://schema.org","@graph":[
          {"@type":"Article","headline":"One"},
          {"@type":"Article","headline":"Two"}
        ]}
      </script>
    `;

    const data = extractStructuredData(html);

    expect(data.jsonLd).toHaveLength(2);
    expect(data.jsonLd[0]).toMatchObject({ "@type": "Article", headline: "One" });
    expect(data.jsonLd[1]).toMatchObject({ headline: "Two" });
  });

  it("extracts a single JSON-LD object as a one-element list", () => {
    const html = `
      <script type="application/ld+json">
        {"@type":"Product","name":"Widget"}
      </script>
    `;

    const data = extractStructuredData(html);

    expect(data.jsonLd).toHaveLength(1);
    expect(data.jsonLd[0]).toMatchObject({ "@type": "Product", name: "Widget" });
  });

  it("skips malformed JSON-LD silently", () => {
    const html = `
      <script type="application/ld+json">{ this is not json </script>
      <script type="application/ld+json">{"@type":"Article","headline":"Good"}</script>
    `;

    const data = extractStructuredData(html);

    expect(data.jsonLd).toHaveLength(1);
    expect(data.jsonLd[0]).toMatchObject({ headline: "Good" });
  });

  it("extracts __NEXT_DATA__", () => {
    const html = `
      <script id="__NEXT_DATA__" type="application/json">
        {"props":{"pageProps":{"title":"Hello"}},"page":"/"}
      </script>
    `;

    const data = extractStructuredData(html);

    expect(data.nextData).toMatchObject({
      props: { pageProps: { title: "Hello" } },
    });
  });

  it("returns undefined nextData for malformed __NEXT_DATA__", () => {
    const html = `<script id="__NEXT_DATA__">not json</script>`;

    const data = extractStructuredData(html);

    expect(data.nextData).toBeUndefined();
  });

  it("concatenates self.__next_f.push flight chunks", () => {
    const html = `
      <script>self.__next_f.push([1,"hello "]);self.__next_f.push([1,"world\\n"])</script>
    `;

    const data = extractStructuredData(html);

    expect(data.nextFlight).toBe("hello world\n");
  });

  it("extracts window.__NUXT__ object", () => {
    const html = `<script>window.__NUXT__={"data":[{"title":"Nuxt Page"}]};</script>`;

    const data = extractStructuredData(html);

    expect(data.nuxt).toMatchObject({ data: [{ title: "Nuxt Page" }] });
  });

  it("extracts window.__APOLLO_STATE__ object", () => {
    const html = `<script>window.__APOLLO_STATE__={"ROOT_QUERY":{}};</script>`;

    const data = extractStructuredData(html);

    expect(data.apollo).toMatchObject({ ROOT_QUERY: {} });
  });

  it("extracts window.__INITIAL_STATE__ object", () => {
    const html = `<script>window.__INITIAL_STATE__={"user":{"id":1}};</script>`;

    const data = extractStructuredData(html);

    expect(data.initialState).toMatchObject({ user: { id: 1 } });
  });

  it("returns empty result for empty html without throwing", () => {
    const data = extractStructuredData("");

    expect(data.jsonLd).toEqual([]);
    expect(data.nextData).toBeUndefined();
    expect(data.nextFlight).toBe("");
    expect(data.nuxt).toBeUndefined();
    expect(data.apollo).toBeUndefined();
    expect(data.initialState).toBeUndefined();
  });
});
