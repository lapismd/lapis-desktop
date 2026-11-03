import { JsonReporter } from "vitest/node";

/** Separate from caller-selected reports so JUnit/JSON flags remain supported. */
export default class CatalogReporter extends JsonReporter {
  constructor() {
    if (!process.env.LAPIS_CATALOG_REPORT)
      throw Error("Catalog reporter requires an owned attempt output path");
    super({ outputFile: process.env.LAPIS_CATALOG_REPORT });
  }
}
