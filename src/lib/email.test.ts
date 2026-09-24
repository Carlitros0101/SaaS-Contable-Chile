import { describe, expect, it } from "vitest";
import { allowsInsecureLocalSmtp } from "./email";

describe("local SMTP development gate", () => {
  it("requires explicit opt-in and a loopback address", () => {
    expect(allowsInsecureLocalSmtp({ nodeEnv: "development", allowInsecureLocal: "true", host: "127.0.0.1" })).toBe(true);
    expect(allowsInsecureLocalSmtp({ nodeEnv: "development", allowInsecureLocal: "true", host: "localhost" })).toBe(true);
    expect(allowsInsecureLocalSmtp({ nodeEnv: "development", host: "127.0.0.1" })).toBe(false);
    expect(allowsInsecureLocalSmtp({ nodeEnv: "development", allowInsecureLocal: "true", host: "smtp.example.com" })).toBe(false);
  });

  it("never allows insecure local SMTP in production", () => {
    expect(allowsInsecureLocalSmtp({ nodeEnv: "production", allowInsecureLocal: "true", host: "127.0.0.1" })).toBe(false);
  });
});
