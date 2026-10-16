import { authApi, groupsApi } from "@/services/api";
import { useAuthStore } from "@/store/auth";
import clsx from "clsx";
import { ArrowLeft, Camera, Check, ChevronRight, Eye, EyeOff, Lock, ShieldCheck, User } from "lucide-react";
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

type Tab = "create" | "join";
type JoinMode = "player" | "admin";
type Step = 0 | 1 | 2 | 3;

const STEPS = ["Perfil", "Grupo", "Emblema", "Senha"] as const;

function StepIndicator({ step }: { step: Step }) {
  return (
    <div className="flex items-center justify-center gap-1 mb-6">
      {STEPS.map((_, i) => (
        <div key={i} className="flex items-center gap-1">
          <div className={clsx(
            "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all",
            i < step  ? "bg-primary text-white"
              : i === step ? "bg-primary text-white ring-2 ring-primary/30"
              : "bg-hover text-text-muted",
          )}>
            {i < step ? <Check size={12} /> : i + 1}
          </div>
          {i < STEPS.length - 1 && (
            <div className={clsx("h-0.5 w-6 rounded-full transition-colors",
              i < step ? "bg-primary" : "bg-border")} />
          )}
        </div>
      ))}
    </div>
  );
}

export function OnboardingPage() {
  const [tab, setTab] = useState<Tab>("create");
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 py-8 bg-bg">
      <div className="mb-6 text-center">
        <div className="text-5xl mb-2">🏐</div>
        <h1 className="text-2xl font-bold text-text">Racha Vôlei</h1>
        <p className="text-text-muted text-xs mt-1">Peladas de areia — dupla e quarteto</p>
      </div>

      <div className="w-full max-w-sm">
        <div className="flex bg-surface border border-border rounded-xl p-1 mb-5">
          {(["create", "join"] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={clsx("flex-1 py-2 text-sm font-medium rounded-lg transition-colors",
                tab === t ? "bg-primary text-white" : "text-text-muted hover:text-text")}>
              {t === "create" ? "Criar Grupo" : "Entrar"}
            </button>
          ))}
        </div>

        {tab === "create" && <CreateWizard setAuth={setAuth} navigate={navigate} />}
        {tab === "join"   && <JoinSection  setAuth={setAuth} navigate={navigate} />}
      </div>
    </div>
  );
}

// ── Wizard ─────────────────────────────────────────────────────────────────
function CreateWizard({ setAuth, navigate }: { setAuth: any; navigate: any }) {
  const [step, setStep] = useState<Step>(0);
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: "", nickname: "", gender: "M", height: "",
    groupName: "", description: "", groupModes: ["quartet"] as string[],
    emblemFile: null as File | null, emblemPreview: "",
    adminPassword: "", adminPasswordConfirm: "",
  });

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  function toggleMode(mode: string) {
    setForm((f) => ({
      ...f,
      groupModes: f.groupModes.includes(mode)
        ? f.groupModes.filter((m) => m !== mode)
        : [...f.groupModes, mode],
    }));
  }

  function validateStep(): string | null {
    if (step === 0) {
      if (!form.name.trim())     return "Informe seu nome";
      if (!form.nickname.trim()) return "Informe seu apelido";
    }
    if (step === 1) {
      if (!form.groupName.trim())       return "Informe o nome do grupo";
      if (form.groupModes.length === 0) return "Selecione ao menos uma modalidade";
    }
    if (step === 3) {
      if (form.adminPassword.length < 4)                    return "Senha mínima de 4 caracteres";
      if (form.adminPassword !== form.adminPasswordConfirm) return "As senhas não conferem";
    }
    return null;
  }

  function next() {
    const err = validateStep();
    if (err) { toast.error(err); return; }
    setStep((s) => (s + 1) as Step);
  }

  async function submit() {
    const err = validateStep();
    if (err) { toast.error(err); return; }
    setLoading(true);
    try {
      const res = await authApi.register({
        name: form.name, nickname: form.nickname,
        gender: form.gender,
        height: form.height ? Number(form.height) : undefined,
        groupName: form.groupName, groupModes: form.groupModes,
        adminPassword: form.adminPassword,
      });
      if (form.emblemFile) {
        try { await groupsApi.uploadEmblem(res.group._id, form.emblemFile); }
        catch { /* non-blocking */ }
      }
      setAuth(res.token, res.player, res.group, "admin");
      navigate("/dashboard");
    } catch (e: any) {
      toast.error(e.response?.data?.error || "Erro ao criar grupo");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <StepIndicator step={step} />

      {step === 0 && (
        <div className="space-y-4">
          <div className="card space-y-3">
            <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wide">Seu Perfil</h2>
            <input className="input" placeholder="Nome completo" required autoFocus
              value={form.name} onChange={(e) => set("name", e.target.value)} />
            <input className="input" placeholder="Apelido (único no grupo)"
              value={form.nickname} onChange={(e) => set("nickname", e.target.value)} />
            <div className="grid grid-cols-2 gap-3">
              <select className="input" value={form.gender} onChange={(e) => set("gender", e.target.value)}>
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
              </select>
              <input className="input" type="number" placeholder="Altura (cm)" min="100" max="250"
                value={form.height} onChange={(e) => set("height", e.target.value)} />
            </div>
          </div>
          <button className="btn-primary w-full py-3 gap-2" onClick={next}>
            Próximo <ChevronRight size={16} />
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div className="card space-y-3">
            <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wide">Seu Grupo</h2>
            <input className="input" placeholder="Nome do grupo" autoFocus
              value={form.groupName} onChange={(e) => set("groupName", e.target.value)} />
            <textarea className="input resize-none" placeholder="Descrição (opcional)" rows={2}
              value={form.description} onChange={(e) => set("description", e.target.value)} />
            <div>
              <p className="text-xs text-text-muted mb-2">Modalidades</p>
              <div className="grid grid-cols-2 gap-2">
                {[{ value: "quartet", label: "🏐 Quarteto (4×4)" }, { value: "doubles", label: "🤝 Dupla (2×2)" }]
                  .map(({ value, label }) => (
                    <button key={value} type="button" onClick={() => toggleMode(value)}
                      className={clsx("py-3 px-3 rounded-xl text-sm font-medium border transition-colors text-left",
                        form.groupModes.includes(value)
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-hover text-text-muted hover:text-text")}>
                      {label}
                    </button>
                  ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn-ghost py-3 px-4" onClick={() => setStep(0)}><ArrowLeft size={16} /></button>
            <button className="btn-primary flex-1 py-3 gap-2" onClick={next}>Próximo <ChevronRight size={16} /></button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="card space-y-4">
            <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wide">Emblema do Grupo</h2>
            <p className="text-xs text-text-muted">Imagem que representa seu grupo. Você pode pular e adicionar depois.</p>
            <div className="flex flex-col items-center gap-3">
              <button type="button" onClick={() => fileRef.current?.click()}
                className={clsx("w-28 h-28 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors overflow-hidden",
                  form.emblemPreview ? "border-primary" : "border-border hover:border-primary/50")}>
                {form.emblemPreview
                  ? <img src={form.emblemPreview} alt="Emblema" className="w-full h-full object-cover" />
                  : <><Camera size={26} className="text-text-muted" /><span className="text-xs text-text-muted">Escolher</span></>}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) { set("emblemFile", f); set("emblemPreview", URL.createObjectURL(f)); }
                }} />
              {form.emblemPreview && (
                <button type="button" onClick={() => { set("emblemFile", null); set("emblemPreview", ""); }}
                  className="text-xs text-text-muted hover:text-primary transition-colors">
                  Remover
                </button>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn-ghost py-3 px-4" onClick={() => setStep(1)}><ArrowLeft size={16} /></button>
            <button className="btn-ghost flex-1 py-3 text-sm" onClick={() => setStep(3)}>Pular</button>
            <button className="btn-primary flex-1 py-3 gap-2" onClick={next}>Próximo <ChevronRight size={16} /></button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="card space-y-3">
            <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wide flex items-center gap-1.5">
              <Lock size={12} /> Senha de Admin
            </h2>
            <p className="text-xs text-text-muted">Usada para entrar como admin em outros dispositivos. Guarde bem!</p>
            <div className="relative">
              <input className="input pr-10" type={showPw ? "text" : "password"} autoFocus
                placeholder="Crie uma senha (mín. 4 caracteres)" minLength={4}
                value={form.adminPassword} onChange={(e) => set("adminPassword", e.target.value)} />
              <button type="button" onClick={() => setShowPw((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <input className="input" type={showPw ? "text" : "password"} placeholder="Confirme a senha" minLength={4}
              value={form.adminPasswordConfirm} onChange={(e) => set("adminPasswordConfirm", e.target.value)} />
          </div>

          {/* Summary */}
          <div className="card flex items-center gap-3 bg-hover border-border/50">
            {form.emblemPreview
              ? <img src={form.emblemPreview} alt="" className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
              : <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center text-xl flex-shrink-0">🏐</div>}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text truncate">{form.groupName}</p>
              <p className="text-xs text-text-muted">
                {form.groupModes.map((m) => (m === "quartet" ? "Quarteto" : "Dupla")).join(" + ")}
                {" · "}{form.nickname}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button className="btn-ghost py-3 px-4" onClick={() => setStep(2)}><ArrowLeft size={16} /></button>
            <button className="btn-primary flex-1 py-3 gap-2" onClick={submit} disabled={loading}>
              {loading ? "Criando..." : <><Check size={16} /> Criar Grupo</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Join ──────────────────────────────────────────────────────────────────
function JoinSection({ setAuth, navigate }: { setAuth: any; navigate: any }) {
  const [mode, setMode] = useState<JoinMode | null>(null);

  if (!mode) {
    return (
      <div className="space-y-3">
        <p className="text-xs text-text-muted text-center mb-2">Como você quer entrar?</p>
        {[
          { m: "player" as JoinMode, icon: <User size={22} className="text-text-muted" />, bg: "bg-hover",
            title: "Jogador", sub: "Novo no grupo — cria seu perfil e entra" },
          { m: "admin"  as JoinMode, icon: <ShieldCheck size={22} className="text-primary" />, bg: "bg-primary/10",
            title: "Admin", sub: "Já tenho conta — entrar com apelido e senha" },
        ].map(({ m, icon, bg, title, sub }) => (
          <button key={m} onClick={() => setMode(m)}
            className="w-full card flex items-center gap-4 hover:border-primary/40 transition-colors text-left">
            <div className={clsx("w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0", bg)}>{icon}</div>
            <div className="flex-1">
              <p className="font-semibold text-text text-sm">{title}</p>
              <p className="text-xs text-text-muted mt-0.5">{sub}</p>
            </div>
            <ChevronRight size={16} className="text-text-muted" />
          </button>
        ))}
      </div>
    );
  }

  return (
    <div>
      <button onClick={() => setMode(null)}
        className="flex items-center gap-2 text-text-muted hover:text-text text-sm mb-4 transition-colors">
        <ArrowLeft size={15} />
        <span className="font-medium">{mode === "player" ? "Entrar como jogador" : "Login de admin"}</span>
      </button>
      {mode === "player" && <PlayerJoinForm setAuth={setAuth} navigate={navigate} />}
      {mode === "admin"  && <AdminLoginForm  setAuth={setAuth} navigate={navigate} />}
    </div>
  );
}

function PlayerJoinForm({ setAuth, navigate }: { setAuth: any; navigate: any }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ inviteCode: "", name: "", nickname: "", gender: "M", height: "" });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authApi.join({
        inviteCode: form.inviteCode, name: form.name,
        nickname: form.nickname, gender: form.gender,
        height: form.height ? Number(form.height) : undefined,
      });
      setAuth(res.token, res.player, res.group, "player");
      navigate("/dashboard");
    } catch (e: any) {
      toast.error(e.response?.data?.error || "Código de convite inválido");
    } finally { setLoading(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="card space-y-3">
        <input className="input font-mono text-center text-lg tracking-widest uppercase"
          placeholder="Código do grupo (XXXXXXXX)" maxLength={8} required autoFocus
          value={form.inviteCode} onChange={(e) => set("inviteCode", e.target.value.toUpperCase())} />
      </div>
      <div className="card space-y-3">
        <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wide">Seu Perfil</h2>
        <input className="input" placeholder="Nome completo" required
          value={form.name} onChange={(e) => set("name", e.target.value)} />
        <input className="input" placeholder="Apelido (único no grupo)" required
          value={form.nickname} onChange={(e) => set("nickname", e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <select className="input" value={form.gender} onChange={(e) => set("gender", e.target.value)}>
            <option value="M">Masculino</option>
            <option value="F">Feminino</option>
          </select>
          <input className="input" type="number" placeholder="Altura (cm)" min="100" max="250"
            value={form.height} onChange={(e) => set("height", e.target.value)} />
        </div>
      </div>
      <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
        {loading ? "Entrando..." : "Entrar no Grupo"}
      </button>
    </form>
  );
}

function AdminLoginForm({ setAuth, navigate }: { setAuth: any; navigate: any }) {
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({ inviteCode: "", nickname: "", adminPassword: "" });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authApi.login({
        inviteCode: form.inviteCode,
        nickname: form.nickname,
        adminPassword: form.adminPassword,
      });
      setAuth(res.token, res.player, res.group, "admin");
      navigate("/dashboard");
    } catch (e: any) {
      toast.error(e.response?.data?.error || "Credenciais inválidas");
    } finally { setLoading(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="card space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck size={14} className="text-primary" />
          <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wide">Login Admin</h2>
        </div>
        <input className="input font-mono text-center text-lg tracking-widest uppercase"
          placeholder="Código do grupo (XXXXXXXX)" maxLength={8} required autoFocus
          value={form.inviteCode} onChange={(e) => set("inviteCode", e.target.value.toUpperCase())} />
        <input className="input" placeholder="Seu apelido no grupo" required
          value={form.nickname} onChange={(e) => set("nickname", e.target.value)} />
        <div className="relative">
          <input className="input pr-10" type={showPw ? "text" : "password"}
            placeholder="Senha de admin" required
            value={form.adminPassword} onChange={(e) => set("adminPassword", e.target.value)} />
          <button type="button" onClick={() => setShowPw((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
            {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </div>
      <button type="submit" className="btn-primary w-full py-3 gap-2" disabled={loading}>
        {loading ? "Entrando..." : <><ShieldCheck size={15} /> Entrar como Admin</>}
      </button>
    </form>
  );
}
