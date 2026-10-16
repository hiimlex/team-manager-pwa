import { describe, expect, it } from "vitest";

// Auth token signing/verification — pure logic test
import jwt from "jsonwebtoken";

const SECRET = "test-secret";

function signToken(playerId: string, groupId: string, role: string) {
  return jwt.sign({ playerId, groupId, role }, SECRET, { expiresIn: "1d" });
}

describe("JWT auth helpers", () => {
  it("signs and verifies a valid token", () => {
    const token = signToken("player1", "group1", "admin");
    const payload = jwt.verify(token, SECRET) as any;
    expect(payload.playerId).toBe("player1");
    expect(payload.groupId).toBe("group1");
    expect(payload.role).toBe("admin");
  });

  it("rejects token signed with wrong secret", () => {
    const token = signToken("player1", "group1", "admin");
    expect(() => jwt.verify(token, "wrong-secret")).toThrow();
  });

  it("rejects expired token", async () => {
    const token = jwt.sign(
      { playerId: "p1", groupId: "g1", role: "player" },
      SECRET,
      { expiresIn: 0 },
    );
    // Allow 1ms for expiry
    await new Promise((r) => setTimeout(r, 5));
    expect(() => jwt.verify(token, SECRET)).toThrow(/expired/);
  });

  it("contains expected fields", () => {
    const token = signToken("abc", "xyz", "moderator");
    const payload = jwt.decode(token) as any;
    expect(payload).toHaveProperty("playerId", "abc");
    expect(payload).toHaveProperty("groupId", "xyz");
    expect(payload).toHaveProperty("role", "moderator");
    expect(payload).toHaveProperty("exp");
    expect(payload).toHaveProperty("iat");
  });
});
