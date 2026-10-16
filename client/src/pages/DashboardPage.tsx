import { playersApi, rachasApi, rankingsApi } from "@/services/api";
import { useAuthStore } from "@/store/auth";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Plus, Trophy, Users, Zap } from "lucide-react";
import { Link } from "react-router-dom";

export function DashboardPage() {
  const { group, player, role } = useAuthStore();

  const { data: players } = useQuery({
    queryKey: ["players", "group"],
    queryFn: () => playersApi.getMyGroup(),
  });

  const { data: rachas } = useQuery({
    queryKey: ["rachas", group?._id],
    queryFn: () => rachasApi.listByGroup(group!._id),
    enabled: !!group,
  });

  const { data: topWinners } = useQuery({
    queryKey: ["rankings", "top-winners"],
    queryFn: () => rankingsApi.topWinners(group?._id),
    enabled: !!group,
  });

  const activeRacha = rachas?.find((r: any) => r.status === "active");

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-xl font-bold text-text">
          Olá, <span className="text-primary">{player?.nickname}</span> 👋
        </h1>
        <p className="text-text-muted text-sm">{group?.name}</p>
      </div>

      {/* Active racha alert */}
      {activeRacha && (
        <Link
          to={`/rachas/${activeRacha._id}`}
          className="card flex items-center gap-3 border-primary/40 bg-primary/10 hover:bg-primary/20 transition-colors"
        >
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse-slow" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-primary">
              Racha em andamento
            </p>
            <p className="text-xs text-text-muted">
              {activeRacha.players?.length} jogadores
            </p>
          </div>
          <ChevronRight size={16} className="text-text-muted" />
        </Link>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center">
          <p className="text-2xl font-bold text-text">{players?.length ?? 0}</p>
          <p className="text-xs text-text-muted mt-1">Jogadores</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-text">{rachas?.length ?? 0}</p>
          <p className="text-xs text-text-muted mt-1">Rachas</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-text">
            {rachas?.reduce(
              (acc: number, r: any) => acc + (r.matches?.length ?? 0),
              0,
            ) ?? 0}
          </p>
          <p className="text-xs text-text-muted mt-1">Partidas</p>
        </div>
      </div>

      {/* Quick actions */}
      {(role === "admin" || role === "moderator") && !activeRacha && (
        <div>
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-3">
            Ações rápidas
          </h2>
          <Link
            to="/rachas"
            className="btn-primary w-full py-3 flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            Iniciar Novo Racha
          </Link>
        </div>
      )}

      {/* Quick links */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide">
          Navegar
        </h2>
        {[
          {
            to: "/players",
            icon: Users,
            label: "Jogadores",
            desc: `${players?.length ?? 0} cadastrados`,
          },
          {
            to: "/rachas",
            icon: Zap,
            label: "Rachas",
            desc: "Histórico de peladas",
          },
          {
            to: "/rankings",
            icon: Trophy,
            label: "Rankings",
            desc: "Top jogadores e duplas",
          },
        ].map(({ to, icon: Icon, label, desc }) => (
          <Link
            key={to}
            to={to}
            className="card flex items-center gap-4 hover:border-primary/40 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-hover flex items-center justify-center">
              <Icon size={20} className="text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-text">{label}</p>
              <p className="text-xs text-text-muted">{desc}</p>
            </div>
            <ChevronRight size={16} className="text-text-muted" />
          </Link>
        ))}
      </div>

      {/* Top 3 winners */}
      {topWinners?.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-3">
            🏆 Top Vencedores
          </h2>
          <div className="space-y-2">
            {topWinners.slice(0, 3).map((p: any, i: number) => (
              <Link
                key={p._id}
                to={`/players/${p._id}`}
                className="card flex items-center gap-3 hover:border-primary/40 transition-colors"
              >
                <span
                  className="text-lg font-bold w-6 text-center"
                  style={{ color: ["#FFD700", "#C0C0C0", "#CD7F32"][i] }}
                >
                  {["🥇", "🥈", "🥉"][i]}
                </span>
                {p.photo ? (
                  <img
                    src={p.photo}
                    alt={p.nickname}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-hover flex items-center justify-center text-sm font-bold text-primary">
                    {p.nickname[0]}
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium text-text">{p.nickname}</p>
                  <p className="text-xs text-text-muted">{p.wins} vitórias</p>
                </div>
                <span className="text-xs text-text-muted">
                  {p.overall.toFixed(1)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
