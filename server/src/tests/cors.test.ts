import { describe, expect, it } from "vitest";
import { isOriginAllowed } from "../config/cors.js";

const prod = (CORS_ORIGIN: string) => ({ NODE_ENV: "production", CORS_ORIGIN });

describe("isOriginAllowed", () => {
  it("allows requests without Origin header", () => {
    expect(isOriginAllowed(undefined, prod(""))).toBe(true);
  });

  it("allows any origin outside production", () => {
    expect(
      isOriginAllowed("http://192.168.0.10:5173", { NODE_ENV: "development" }),
    ).toBe(true);
  });

  it("matches an exact origin, ignoring trailing slash and case", () => {
    const env = prod("https://Racha-Volei.vercel.app/");
    expect(isOriginAllowed("https://racha-volei.vercel.app", env)).toBe(true);
  });

  it("supports a comma-separated list", () => {
    const env = prod("https://a.com, https://b.com");
    expect(isOriginAllowed("https://b.com", env)).toBe(true);
    expect(isOriginAllowed("https://c.com", env)).toBe(false);
  });

  it("supports wildcard entries for preview deployments", () => {
    const env = prod("https://racha-volei-*.vercel.app");
    expect(
      isOriginAllowed("https://racha-volei-git-main-alex.vercel.app", env),
    ).toBe(true);
    expect(isOriginAllowed("https://evil.com/.vercel.app", env)).toBe(false);
    expect(isOriginAllowed("https://other.vercel.app", env)).toBe(false);
  });

  it("rejects everything in production when CORS_ORIGIN is empty", () => {
    expect(isOriginAllowed("https://racha-volei.vercel.app", prod(""))).toBe(
      false,
    );
  });
});
