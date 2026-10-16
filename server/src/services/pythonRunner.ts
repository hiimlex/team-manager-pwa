import { spawn } from "child_process";
import { tmpdir } from "os";

const TIMEOUT_MS = 5000;
const MAX_OUTPUT_BYTES = 1024 * 1024;
const MAX_CONCURRENT_RUNS = 2;

let runningScripts = 0;

interface PlayerInput {
  _id: string;
  name: string;
  nickname: string;
  overall: number;
  position: string;
  gender: string;
  stats: Record<string, number>;
}

/**
 * Python harness. The user script is NOT interpolated into the source: it is
 * read from stdin together with the input data and executed with exec().
 *
 * Defense in depth (this is not a perfect sandbox — scripts are only accepted
 * from group admins):
 * - the process gets an empty environment (no DB/API secrets) and runs in a
 *   temp dir with `-I -S -B` (isolated mode, no site, no .pyc writes);
 * - rlimits cap CPU, memory, file writes and process creation;
 * - an audit hook installed before running user code blocks every runtime
 *   event (file access, sockets, subprocesses, os.*, ctypes…) except a small
 *   allowlist, and only pre-loaded pure-computation modules can be imported.
 */
const HARNESS = `
import sys, json, io, resource

data = json.loads(sys.stdin.read())

MB = 1024 * 1024
for res, val in (
    (resource.RLIMIT_CPU, 4),
    (resource.RLIMIT_AS, 256 * MB),
    (resource.RLIMIT_FSIZE, 0),
    (resource.RLIMIT_NPROC, 0),
):
    try:
        resource.setrlimit(res, (val, val))
    except (ValueError, OSError):
        pass

import random, math, itertools, functools, collections, statistics, operator, copy, heapq, bisect, string, re

ALLOWED_MODULES = {
    "random", "math", "itertools", "functools", "collections", "statistics",
    "operator", "copy", "heapq", "bisect", "string", "re", "json",
}
ALLOWED_EVENTS = {"exec", "compile", "import", "builtins.id", "sys._getframe"}

def _guard(event, args):
    if event == "import":
        if str(args[0]).split(".")[0] not in ALLOWED_MODULES:
            raise RuntimeError(f"Importação não permitida: {args[0]}")
        return
    if event not in ALLOWED_EVENTS:
        raise RuntimeError(f"Operação não permitida no script: {event}")

import builtins
_real_import = builtins.__import__

# Already-loaded modules (os, sys…) don't raise the "import" audit event,
# so the import statement itself is restricted too
def _safe_import(name, globals=None, locals=None, fromlist=(), level=0):
    if level != 0 or name.split(".")[0] not in ALLOWED_MODULES:
        raise ImportError(f"Importação não permitida: {name}")
    return _real_import(name, globals, locals, fromlist, level)

safe_builtins = dict(vars(builtins))
safe_builtins["__import__"] = _safe_import
for _name in ("open", "input", "breakpoint", "exit", "quit", "help"):
    safe_builtins.pop(_name, None)

real_stdout = sys.stdout
sys.stdout = io.StringIO()  # user prints must not corrupt the JSON output
code = compile(data["code"], "<script>", "exec")
scope = {
    "__builtins__": safe_builtins,
    "players": data["players"],
    "match_type": data["match_type"],
    "teams": [],
}

sys.addaudithook(_guard)
try:
    exec(code, scope)
    result = {"teams": scope.get("teams")}
except Exception as e:
    result = {"error": f"{type(e).__name__}: {e}"}

real_stdout.write(json.dumps(result))
real_stdout.flush()
`;

/**
 * Executes a Python draw script in a restricted child process.
 * The script receives `players` and `match_type` variables,
 * and must produce a `teams` variable (list of lists of player IDs).
 */
export function runPythonScript(
  userScript: string,
  players: any[],
  matchType: "quartet" | "doubles",
): Promise<string[][]> {
  return new Promise((resolve, reject) => {
    if (runningScripts >= MAX_CONCURRENT_RUNS) {
      reject(new Error("Servidor ocupado executando scripts, tente novamente"));
      return;
    }

    const playerData: PlayerInput[] = players.map((p) => ({
      _id: String(p._id),
      name: p.name,
      nickname: p.nickname,
      overall: p.overall,
      position: p.position,
      gender: p.gender,
      stats: p.stats ? p.stats.toObject?.() || p.stats : {},
    }));
    const validIds = new Set(playerData.map((p) => p._id));

    runningScripts++;
    const proc = spawn("python3", ["-I", "-S", "-B", "-c", HARNESS], {
      stdio: ["pipe", "pipe", "pipe"],
      cwd: tmpdir(),
      env: { PATH: "/usr/local/bin:/usr/bin:/bin", LANG: "C.UTF-8" },
    });

    let stdout = "";
    let stderr = "";
    let settled = false;

    const finish = (err: Error | null, teams?: string[][]) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      runningScripts--;
      if (!proc.killed && proc.exitCode === null) proc.kill("SIGKILL");
      if (err) reject(err);
      else resolve(teams!);
    };

    const timer = setTimeout(
      () => finish(new Error("Script excedeu o tempo limite de 5 segundos")),
      TIMEOUT_MS,
    );

    proc.stdout.on("data", (d) => {
      stdout += d.toString();
      if (stdout.length > MAX_OUTPUT_BYTES) {
        finish(new Error("Saída do script muito grande"));
      }
    });
    proc.stderr.on("data", (d) => {
      if (stderr.length < MAX_OUTPUT_BYTES) stderr += d.toString();
    });
    proc.on("error", (err) =>
      finish(new Error(`Falha ao iniciar Python: ${err.message}`)),
    );

    proc.on("close", (code) => {
      if (code !== 0) {
        finish(new Error(stderr.trim() || "Erro ao executar script Python"));
        return;
      }

      let result: { teams?: unknown; error?: string };
      try {
        result = JSON.parse(stdout.trim());
      } catch {
        finish(new Error("Saída inválida do script Python"));
        return;
      }

      if (result.error) {
        finish(new Error(result.error));
        return;
      }
      const teams = result.teams;
      if (
        !Array.isArray(teams) ||
        !teams.every(
          (t) => Array.isArray(t) && t.every((id) => typeof id === "string"),
        )
      ) {
        finish(
          new Error(
            'O script deve definir a variável "teams" como uma lista de listas',
          ),
        );
        return;
      }
      if (teams.length === 0) {
        finish(
          new Error("O script não produziu nenhum time (teams está vazio)"),
        );
        return;
      }
      const ids = (teams as string[][]).flat();
      if (!ids.every((id) => validIds.has(id))) {
        finish(new Error("O script retornou IDs de jogadores desconhecidos"));
        return;
      }
      if (new Set(ids).size !== ids.length) {
        finish(
          new Error("O script colocou o mesmo jogador em mais de um time"),
        );
        return;
      }
      finish(null, teams as string[][]);
    });

    proc.stdin.on("error", () => {}); // process may exit before reading stdin
    proc.stdin.end(
      JSON.stringify({
        code: userScript,
        players: playerData,
        match_type: matchType,
      }),
    );
  });
}
