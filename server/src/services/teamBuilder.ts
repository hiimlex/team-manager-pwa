interface PlayerLike {
  _id: any;
  overall: number;
  position: string;
  gender: string;
  stats: {
    setting: number;
    passing: number;
    attack: number;
    blocking: number;
    physical: number;
    technique: number;
    gameVision: number;
  };
  affinities?: Array<{ player: any; wins: number; total: number }>;
}

/**
 * Default team building algorithm — serpentine distribution by overall rating.
 * Ensures setters are split across teams when possible.
 * Considers player affinities: pairs with high win-rate together are preferred on the same team.
 */
export function buildTeams(
  players: PlayerLike[],
  type: "quartet" | "doubles",
): string[][] {
  const teamSize = type === "quartet" ? 4 : 2;
  const teamCount = Math.floor(players.length / teamSize);
  const teams: string[][] = Array.from({ length: teamCount }, () => []);

  // Separate setters from others
  const setters = players
    .filter((p) => p.position === "setter")
    .sort((a, b) => b.overall - a.overall);
  const others = players
    .filter((p) => p.position !== "setter")
    .sort((a, b) => b.overall - a.overall);

  // Assign one setter per team first (serpentine direction)
  setters.forEach((setter, i) => {
    const teamIdx = i % teamCount;
    teams[teamIdx].push(String(setter._id));
  });

  // Fill remaining slots with serpentine distribution
  let dir = 1;
  let teamIdx = 0;
  for (const player of others) {
    if (teams[teamIdx] === undefined) break;
    if (teams[teamIdx].length >= teamSize) continue;
    teams[teamIdx].push(String(player._id));

    if (teamCount > 1) {
      if (teamIdx === teamCount - 1) dir = -1;
      else if (teamIdx === 0) dir = 1;
      teamIdx += dir;
    }
  }

  // Affinity swap pass: try to pair high-affinity players on the same team
  _applyAffinitySwaps(teams, players);

  return teams.filter((t) => t.length > 0);
}

/** Swap players between teams to maximise affinity score without unbalancing overall too much. */
function _applyAffinitySwaps(teams: string[][], players: PlayerLike[]) {
  const MAX_OVERALL_DELTA = 1.5;
  const byId = new Map(players.map((p) => [String(p._id), p]));

  function affinityScore(teamIds: string[]): number {
    let score = 0;
    for (let i = 0; i < teamIds.length; i++) {
      const p = byId.get(teamIds[i]);
      if (!p?.affinities) continue;
      for (let j = i + 1; j < teamIds.length; j++) {
        const aff = p.affinities.find((a) => String(a.player) === teamIds[j]);
        if (aff && aff.total >= 2) score += aff.wins / aff.total;
      }
    }
    return score;
  }

  function teamOverallAvg(ids: string[]) {
    const ps = ids.map((id) => byId.get(id)).filter(Boolean) as PlayerLike[];
    return ps.length ? ps.reduce((s, p) => s + p.overall, 0) / ps.length : 0;
  }

  // Single swap pass between team 0 and team 1
  if (teams.length < 2) return;
  const [a, b] = teams;
  let bestGain = 0;
  let bestSwap: [number, number] | null = null;

  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) {
      const after = [...a];
      after[i] = b[j];
      const afterB = [...b];
      afterB[j] = a[i];
      const overallDelta = Math.abs(
        teamOverallAvg(after) - teamOverallAvg(afterB),
      );
      if (overallDelta > MAX_OVERALL_DELTA) continue;
      const gain =
        affinityScore(after) +
        affinityScore(afterB) -
        affinityScore(a) -
        affinityScore(b);
      if (gain > bestGain) {
        bestGain = gain;
        bestSwap = [i, j];
      }
    }
  }

  if (bestSwap) {
    const [i, j] = bestSwap;
    [teams[0][i], teams[1][j]] = [teams[1][j], teams[0][i]];
  }
}

/** Calculate team overall average */
export function teamOverall(players: PlayerLike[]): number {
  if (players.length === 0) return 0;
  return players.reduce((acc, p) => acc + p.overall, 0) / players.length;
}
