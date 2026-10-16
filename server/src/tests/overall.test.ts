import { describe, expect, it } from "vitest";

// Pure unit tests for the overall formula (mirrors the pre-save hook)
function calcOverall(stats: {
  setting: number;
  passing: number;
  attack: number;
  blocking: number;
  physical: number;
  technique: number;
  gameVision: number;
}): number {
  return (
    Math.round(
      (stats.setting * 0.12 +
        stats.passing * 0.15 +
        stats.attack * 0.2 +
        stats.blocking * 0.12 +
        stats.physical * 0.18 +
        stats.technique * 0.13 +
        stats.gameVision * 0.1) *
        10,
    ) / 10
  );
}

describe("Player overall formula", () => {
  it("all-5 stats gives overall 5", () => {
    const overall = calcOverall({
      setting: 5,
      passing: 5,
      attack: 5,
      blocking: 5,
      physical: 5,
      technique: 5,
      gameVision: 5,
    });
    expect(overall).toBeCloseTo(5, 1);
  });

  it("all-10 stats gives overall 10", () => {
    const overall = calcOverall({
      setting: 10,
      passing: 10,
      attack: 10,
      blocking: 10,
      physical: 10,
      technique: 10,
      gameVision: 10,
    });
    expect(overall).toBeCloseTo(10, 1);
  });

  it("all-1 stats gives overall 1", () => {
    const overall = calcOverall({
      setting: 1,
      passing: 1,
      attack: 1,
      blocking: 1,
      physical: 1,
      technique: 1,
      gameVision: 1,
    });
    expect(overall).toBeCloseTo(1, 1);
  });

  it("high attack player has higher overall than high setting player (attack weighs more)", () => {
    const attacker = calcOverall({
      setting: 5,
      passing: 5,
      attack: 10,
      blocking: 5,
      physical: 5,
      technique: 5,
      gameVision: 5,
    });
    const setter = calcOverall({
      setting: 10,
      passing: 5,
      attack: 5,
      blocking: 5,
      physical: 5,
      technique: 5,
      gameVision: 5,
    });
    expect(attacker).toBeGreaterThan(setter);
  });

  it("weights sum to 1.0", () => {
    const weights = [0.12, 0.15, 0.2, 0.12, 0.18, 0.13, 0.1];
    const sum = weights.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 5);
  });
});
