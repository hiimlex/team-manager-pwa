import { scriptsApi } from "@/services/api";
import { useAuthStore } from "@/store/auth";
import type { DrawScript } from "@/types";
import Editor from "@monaco-editor/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { ChevronDown, Code2, Play, Plus, Save, Trash2 } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

const DEFAULT_CODE = `# Variáveis disponíveis:
# players: list[dict] — jogadores com _id, name, nickname, overall, position, gender, stats
# match_type: str — 'quartet' ou 'doubles'
# Defina a variável 'teams': list[list[str]] — cada lista contém IDs dos jogadores

players_sorted = sorted(players, key=lambda p: p['overall'], reverse=True)

teams = [[], []]
for i, player in enumerate(players_sorted):
    teams[i % 2].append(player['_id'])
`;

export function ScriptEditorPage() {
  const { group } = useAuthStore();
  const qc = useQueryClient();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [code, setCode] = useState(DEFAULT_CODE);
  const [name, setName] = useState("Novo Script");
  const [testResult, setTestResult] = useState<any>(null);
  const [showTemplates, setShowTemplates] = useState(false);

  const { data: scripts = [] } = useQuery<DrawScript[]>({
    queryKey: ["scripts", group?._id],
    queryFn: () => scriptsApi.listByGroup(group!._id),
    enabled: !!group,
  });

  const { data: templates = [] } = useQuery({
    queryKey: ["script-templates"],
    queryFn: scriptsApi.getTemplates,
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      selectedId
        ? scriptsApi.update(selectedId, { name, code })
        : scriptsApi.create({ name, code }),
    onSuccess: (saved) => {
      toast.success("Script salvo!");
      setSelectedId(saved._id);
      qc.invalidateQueries({ queryKey: ["scripts"] });
    },
    onError: () => toast.error("Erro ao salvar script"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => scriptsApi.delete(selectedId!),
    onSuccess: () => {
      toast.success("Script removido");
      setSelectedId(null);
      setCode(DEFAULT_CODE);
      setName("Novo Script");
      qc.invalidateQueries({ queryKey: ["scripts"] });
    },
  });

  const testMutation = useMutation({
    mutationFn: () => scriptsApi.test({ code }),
    onSuccess: (data) => {
      setTestResult(data);
      toast.success(`Sorteio OK — ${data.teams.length} times`);
    },
    onError: (err: any) => {
      setTestResult({
        error: err.response?.data?.error || "Erro desconhecido",
      });
      toast.error("Erro no script");
    },
  });

  function loadScript(script: DrawScript) {
    setSelectedId(script._id);
    setCode(script.code);
    setName(script.name);
    setTestResult(null);
  }

  function newScript() {
    setSelectedId(null);
    setCode(DEFAULT_CODE);
    setName("Novo Script");
    setTestResult(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text flex items-center gap-2">
          <Code2 size={22} className="text-primary" /> Editor de Scripts
        </h1>
        <button
          onClick={newScript}
          className="btn-ghost py-1.5 px-3 text-xs gap-1.5"
        >
          <Plus size={14} /> Novo
        </button>
      </div>

      {/* Script list */}
      {scripts.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {scripts.map((s) => (
            <button
              key={s._id}
              onClick={() => loadScript(s)}
              className={clsx(
                "flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                selectedId === s._id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-hover text-text-muted hover:text-text",
              )}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}

      {/* Script name input */}
      <input
        className="input text-sm"
        placeholder="Nome do script"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      {/* Monaco Editor */}
      <div className="rounded-xl overflow-hidden border border-border">
        <div className="bg-surface px-3 py-1.5 flex items-center justify-between text-xs text-text-muted border-b border-border">
          <span>sorteio.py</span>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span>Python</span>
          </div>
        </div>
        <Editor
          height="320px"
          language="python"
          theme="vs-dark"
          value={code}
          onChange={(v) => setCode(v ?? "")}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            fontFamily: "JetBrains Mono, Fira Code, monospace",
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            wordWrap: "on",
            tabSize: 4,
          }}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => testMutation.mutate()}
          className="flex-1 btn-ghost py-2.5 gap-2"
          disabled={testMutation.isPending}
        >
          <Play size={14} /> {testMutation.isPending ? "Testando..." : "Testar"}
        </button>
        <button
          onClick={() => saveMutation.mutate()}
          className="flex-1 btn-primary py-2.5 gap-2"
          disabled={saveMutation.isPending}
        >
          <Save size={14} /> {saveMutation.isPending ? "Salvando..." : "Salvar"}
        </button>
        {selectedId && (
          <button
            onClick={() => deleteMutation.mutate()}
            className="btn-danger px-3 py-2.5"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* Test result */}
      {testResult && (
        <div
          className={clsx(
            "card text-sm",
            testResult.error
              ? "border-primary/40 bg-primary/5"
              : "border-success/40 bg-success/5",
          )}
        >
          {testResult.error ? (
            <p className="text-primary font-mono text-xs">{testResult.error}</p>
          ) : (
            <div>
              <p className="text-success text-xs font-semibold mb-2">
                ✓ Times gerados ({testResult.playerCount} jogadores)
              </p>
              {testResult.teams.map((team: string[], i: number) => (
                <div key={i} className="text-xs text-text-muted">
                  Time {String.fromCharCode(65 + i)}: {team.length} jogadores
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Templates */}
      <div>
        <button
          onClick={() => setShowTemplates((s) => !s)}
          className="flex items-center gap-2 text-sm text-text-muted hover:text-text transition-colors"
        >
          <ChevronDown
            size={16}
            className={clsx(
              "transition-transform",
              showTemplates && "rotate-180",
            )}
          />
          Templates prontos
        </button>

        {showTemplates && (
          <div className="mt-3 space-y-2">
            {(templates as any[]).map((t, i) => (
              <div
                key={i}
                className="card cursor-pointer hover:border-primary/40 transition-colors"
                onClick={() => {
                  setCode(t.code);
                  setName(t.name);
                  setTestResult(null);
                }}
              >
                <p className="text-sm font-medium text-text">{t.name}</p>
                <p className="text-xs text-text-muted mt-0.5">
                  {t.description}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
