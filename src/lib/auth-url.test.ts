import { describe, expect, it } from "vitest";
import { buildAuthUrlConfig } from "./auth-url";

describe("Netlify authentication URLs", () => {
  it("uses the current Deploy Preview URL for generated verification links", () => {
    expect(buildAuthUrlConfig({
      configuredUrl: "https://accounting.netlify.app",
      canonicalUrl: "https://accounting.netlify.app",
      deployUrl: "https://deploy-preview-42--accounting.netlify.app",
    })).toEqual({
      baseURL: "https://deploy-preview-42--accounting.netlify.app",
      trustedOrigins: ["https://accounting.netlify.app", "https://deploy-preview-42--accounting.netlify.app"],
    });
  });

  it("uses the canonical configured URL outside previews", () => {
    expect(buildAuthUrlConfig({ configuredUrl: "https://accounting.netlify.app" })).toEqual({
      baseURL: "https://accounting.netlify.app",
      trustedOrigins: ["https://accounting.netlify.app"],
    });
  });
});
