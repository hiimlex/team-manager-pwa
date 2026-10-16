import { describe, expect, it } from "vitest";
import { buildTeams, teamOverall } from "../services/teamBuilder.js";

const makePlayer = (
  id: string,
  overall: number,
  position = "universal",
  affinities: { player: string; wins: number; total: number }[] = [],
) => ({
  _id: id,
  overall,
  position,
  gender: "M",
  stats: {
    setting: 5,
    passing: 5,
    attack: 5,
    blocking: 5,
    physical: 5,
    technique: 5,
    gameVision: 5,
  },
  affinities,
});

describe("buildTeams — quartet", () => {
  it("splits 8 players into 2 teams of 4", () => {
    const players = Array.from({ length: 8 }, (_, i) =>
      makePlayer(`p${i}`, 5 + i * 0.1),
    );
    const teams = buildTeams(players, "quartet");
    expect(teams).toHaveLength(2);
    expect(teams[0]).toHaveLength(4);
    expect(teams[1]).toHaveLength(4);
  });

  it("assigns no player to two teams", () => {
    const players = Array.from({ length: 8 }, (_, i) => makePlayer(`p${i}`, 5));
    const teams = buildTeams(players, "quartet");
    const allIds = teams.flat();
    const uniqueIds = new Set(allIds);
    expect(uniqueIds.size).toBe(allIds.length);
  });

  it("places setters on opposite teams when possible", () => {
    const players = [
      makePlayer("s1", 8, "setter"),
      makePlayer("s2", 7, "setter"),
      ...Array.from({ length: 6 }, (_, i) => makePlayer(`p${i}`, 5)),
    ];
    const teams = buildTeams(players, "quartet");
    const teamASetter = teams[0].includes("s1") || teams[0].includes("s2");
    const teamBSetter = teams[1].includes("s1") || teams[1].includes("s2");
    expect(teamASetter).toBe(true);
    expect(teamBSetter).toBe(true);
  });

  it("handles fewer players than full teams (6 players)", () => {
    const players = Array.from({ length: 6 }, (_, i) => makePlayer(`p${i}`, 5));
    // 6 / 4 = 1 full team → should still return valid structure
    const teams = buildTeams(players, "quartet");
    expect(teams.length).toBeGreaterThanOrEqual(1);
  });
});

describe("buildTeams — doubles", () => {
  it("splits 4 players into 2 teams of 2", () => {
    const players = Array.from({ length: 4 }, (_, i) =>
      makePlayer(`p${i}`, 6 + i * 0.5),
    );
    const teams = buildTeams(players, "doubles");
    expect(teams).toHaveLength(2);
    expect(teams[0]).toHaveLength(2);
    expect(teams[1]).toHaveLength(2);
  });
});

describe("buildTeams — affinity", () => {
  it("swaps to keep high-affinity pair on the same team when balance allows", () => {
    // p0 and p2 have strong affinity; after serpentine p0→team0, p2→team1
    // algo should swap p2 with p3 (same overall) to put p0+p2 together
    const players = [
      makePlayer("p0", 7, "universal", [{ player: "p2", wins: 9, total: 10 }]),
      makePlayer("p1", 6.9, "universal"),
      makePlayer("p2", 6.8, "universal", [
        { player: "p0", wins: 9, total: 10 },
      ]),
      makePlayer("p3", 6.7, "universal"),
    ];
    const teams = buildTeams(players, "doubles");
    const allIds = teams.flat();
    // Both players should exist somewhere
    expect(allIds).toContain("p0");
    expect(allIds).toContain("p2");
    // The affinity pair should ideally be on the same team (may depend on balance)
    const sameTeam = teams.some((t) => t.includes("p0") && t.includes("p2"));
    expect(sameTeam).toBe(true);
  });
});

describe("teamOverall", () => {
  it("returns 0 for empty array", () => {
    expect(teamOverall([])).toBe(0);
  });

  it("computes average correctly", () => {
    const players = [makePlayer("a", 8), makePlayer("b", 6)];
    expect(teamOverall(players)).toBeCloseTo(7);
  });
});
