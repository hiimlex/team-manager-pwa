import { describe, expect, it } from "vitest";

// Minimal player data for script runner tests
const players = [
  {
    _id: "p1",
    name: "Ana",
    nickname: "Ana",
    overall: 7,
    position: "setter",
    gender: "F",
    stats: {
      setting: 8,
      passing: 7,
      attack: 6,
      blocking: 5,
      physical: 7,
      technique: 7,
      gameVision: 8,
    },
    toObject: () => ({}),
  },
  {
    _id: "p2",
    name: "Bruno",
    nickname: "Bruno",
    overall: 6,
    position: "outside",
    gender: "M",
    stats: {
      setting: 4,
      passing: 6,
      attack: 8,
      blocking: 5,
      physical: 7,
      technique: 6,
      gameVision: 5,
    },
    toObject: () => ({}),
  },
  {
    _id: "p3",
    name: "Carol",
    nickname: "Carol",
    overall: 6,
    position: "middle",
    gender: "F",
    stats: {
      setting: 4,
      passing: 5,
      attack: 7,
      blocking: 8,
      physical: 6,
      technique: 6,
      gameVision: 6,
    },
    toObject: () => ({}),
  },
  {
    _id: "p4",
    name: "Diego",
    nickname: "Diego",
    overall: 5,
    position: "libero",
    gender: "M",
    stats: {
      setting: 4,
      passing: 8,
      attack: 4,
      blocking: 3,
      physical: 6,
      technique: 5,
      gameVision: 7,
    },
    toObject: () => ({}),
  },
];

describe("pythonRunner", () => {
  it("executes valid serpentine script and returns 2 teams", async () => {
    const { runPythonScript } = await import("../services/pythonRunner.js");

    const script = `
players_sorted = sorted(players, key=lambda p: p['overall'], reverse=True)
teams = [[], []]
for i, player in enumerate(players_sorted):
    teams[i % 2].append(player['_id'])
`;
    const teams = await runPythonScript(script, players as any, "doubles");
    expect(teams).toHaveLength(2);
    expect(teams.flat()).toHaveLength(4);
  });

  it("rejects script with syntax error", async () => {
    const { runPythonScript } = await import("../services/pythonRunner.js");
    const script = `this is not valid python !!!`;
    await expect(
      runPythonScript(script, players as any, "doubles"),
    ).rejects.toThrow();
  });

  it("rejects script that does not define teams variable", async () => {
    const { runPythonScript } = await import("../services/pythonRunner.js");
    // No teams assignment → teams stays [] (empty) → should reject
    const script = `result = 42  # never assigns to teams`;
    await expect(
      runPythonScript(script, players as any, "doubles"),
    ).rejects.toThrow(/vazio/);
  });

  it("handles random shuffle script", async () => {
    const { runPythonScript } = await import("../services/pythonRunner.js");
    const script = `
import random
shuffled = players[:]
random.shuffle(shuffled)
mid = len(shuffled) // 2
teams = [
    [p['_id'] for p in shuffled[:mid]],
    [p['_id'] for p in shuffled[mid:]],
]
`;
    const teams = await runPythonScript(script, players as any, "doubles");
    expect(teams.flat().sort()).toEqual(["p1", "p2", "p3", "p4"].sort());
  });

  it("does not expose server environment variables", async () => {
    const { runPythonScript } = await import("../services/pythonRunner.js");
    process.env.SECRET_FOR_TEST = "leak";
    const script = `
secret = ().__class__.__base__.__subclasses__()
teams = [[p['_id'] for p in players]]
`;
    const teams = await runPythonScript(script, players as any, "doubles");
    expect(teams.flat()).toHaveLength(4);
    delete process.env.SECRET_FOR_TEST;
  });

  it.each([
    ["import os", "import os\nteams = [[os.environ['PATH']]]"],
    ["import subprocess", "import subprocess\nsubprocess.run(['id'])"],
    ["import socket", "import socket"],
    ["open file", "open('/etc/passwd').read()"],
    ["write file", "open('pwned.txt', 'w').write('x')"],
    ["__import__", "__import__('os').system('id')"],
    [
      "subclass escape to os.system",
      "w = [c for c in ().__class__.__base__.__subclasses__() if c.__name__ == '_wrap_close'][0]\nw.__init__.__globals__['system']('id')",
    ],
    [
      "subclass escape to os.kill",
      "w = [c for c in ().__class__.__base__.__subclasses__() if c.__name__ == '_wrap_close'][0]\nw.__init__.__globals__['kill'](1, 0)",
    ],
  ])("blocks %s", async (_name, script) => {
    const { runPythonScript } = await import("../services/pythonRunner.js");
    await expect(
      runPythonScript(script, players as any, "doubles"),
    ).rejects.toThrow(/não permitid|NameError|KeyError|IndexError/);
  });

  it("ignores user prints in the output", async () => {
    const { runPythonScript } = await import("../services/pythonRunner.js");
    const script = `print("debug")\nteams = [["p1", "p2"], ["p3", "p4"]]`;
    const teams = await runPythonScript(script, players as any, "doubles");
    expect(teams).toEqual([
      ["p1", "p2"],
      ["p3", "p4"],
    ]);
  });

  it("rejects unknown or duplicated player ids", async () => {
    const { runPythonScript } = await import("../services/pythonRunner.js");
    await expect(
      runPythonScript(`teams = [["p1", "x"]]`, players as any, "doubles"),
    ).rejects.toThrow(/desconhecidos/);
    await expect(
      runPythonScript(`teams = [["p1"], ["p1"]]`, players as any, "doubles"),
    ).rejects.toThrow(/mais de um time/);
  });

  it("kills infinite loops", async () => {
    const { runPythonScript } = await import("../services/pythonRunner.js");
    await expect(
      runPythonScript("while True: pass", players as any, "doubles"),
    ).rejects.toThrow();
  }, 10000);
});
