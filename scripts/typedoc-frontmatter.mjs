// @ts-check
/**
 * Custom TypeDoc frontmatter plugin for Hugo-compatible YAML front-matter.
 * Adds weight and title to each generated API markdown page.
 */
import { MarkdownPageEvent } from "typedoc-plugin-markdown";

/** @param {import("typedoc-plugin-markdown").MarkdownApplication} app */
export function load(app) {
  app.renderer.on(MarkdownPageEvent.BEGIN, (page) => {
    // Determine weight based on page kind for ordering
    let weight = 80;
    const pageTitle = page.model?.name ?? "API";

    // The index page gets a lower weight so it appears first
    if (page.model?.name === "index") {
      weight = 80;
    }

    page.frontmatter = {
      title: `API: ${pageTitle}`,
      weight,
      ...page.frontmatter,
    };
  });
}
