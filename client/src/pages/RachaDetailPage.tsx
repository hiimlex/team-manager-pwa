import { matchesApi, rachasApi } from "@/services/api";
import { useAuthStore } from "@/store/auth";
import type { Match, Player, RachaSession } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, Plus, Tv2 } from "lucide-react";
import toast from "react-hot-toast";
import { Link, useNavigate, useParams } from "react-router-dom";

export function RachaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { role } = useAuthStore();
  const qc = useQueryClient();
  const canManage = role === "admin" || role === "moderator";

  const { data: racha, isLoading } = useQuery<RachaSession>({
    queryKey: ["racha", id],
    queryFn: () => rachasApi.getById(id!),
  });

  const startMatchMutation = useMutation({
    mutationFn: (teams: string[][]) =>
      matchesApi.create({
        rachaId: id!,
        teamAPlayers: teams[0],
        teamBPlayers: teams[1],
        type: racha!.type,
      }),
    onSuccess: (match) => {
      toast.success("Partida iniciada!");
      qc.invalidateQueries({ queryKey: ["racha", id] });
      navigate(`/scoreboard/${match._id}`);
    },
  });

  const finishMutation = useMutation({
    mutationFn: () => rachasApi.finish(id!),
    onSuccess: () => {
      toast.success("Racha encerrado!");
      qc.invalidateQueries({ queryKey: ["racha", id] });
      qc.invalidateQueries({ queryKey: ["rachas"] });
    },
  });

  if (isLoading)
    return (
      <div className="text-center py-12 text-text-muted">Carregando...</div>
    );
  if (!racha)
    return (
      <div className="text-center py-12 text-text-muted">
        Racha não encontrado
      </div>
    );

  const teams = racha.teams as string[][];
  const matches = racha.matches as Match[];
  const players = racha.players as Player[];
  const hasOngoingMatch = matches.some((m) => m.status === "ongoing");

  const getPlayerById = (pid: string) =>
    players.find((p) => (typeof p === "string" ? p : p._id) === pid);

  const getPlayerName = (pid: string | Player) => {
    const p = typeof pid === "string" ? getPlayerById(pid) : pid;
    return (p as Player)?.nickname ?? "?";
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-text-muted hover:text-text text-sm"
        >
          <ArrowLeft size={16} /> Voltar
        </button>
        {racha.status === "active" && canManage && (
          <button
            onClick={() => finishMutation.mutate()}
            className="btn-ghost py-1 px-3 text-xs gap-1.5"
            disabled={finishMutation.isPending}
          >
            <CheckCircle2 size={14} /> Encerrar Racha
          </button>
        )}
      </div>

      {/* Header */}
      <div className="card">
        <div className="flex items-center gap-2 mb-1">
          <span
            className={`badge ${racha.status === "active" ? "badge-red" : "badge-gray"}`}
          >
            {racha.status === "active" ? "🔴 Ao vivo" : "Encerrado"}
          </span>
          <span className="badge-gray capitalize">
            {racha.type === "quartet" ? "Quarteto" : "Dupla"}
          </span>
        </div>
        <p className="text-sm text-text-muted">
          {new Date(racha.date).toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
        <p className="text-xs text-text-muted mt-1">
          {players.length} jogadores · {matches.length} partidas
        </p>
      </div>

      {/* Teams */}
      {teams && teams.length >= 2 && (
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-text">Times Sorteados</h2>
            {racha.status === "active" && canManage && !hasOngoingMatch && (
              <button
                onClick={() => startMatchMutation.mutate(teams)}
                className="btn-primary py-1.5 px-3 text-xs gap-1.5"
                disabled={startMatchMutation.isPending}
              >
                <Plus size={13} /> Nova Partida
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {teams.slice(0, 2).map((team, ti) => (
              <div key={ti} className="bg-hover rounded-xl p-3">
                <p className="text-xs font-semibold text-text-muted mb-2 uppercase">
                  Time {ti === 0 ? "A" : "B"}
                </p>
                <div className="space-y-1.5">
                  {team.map((pid) => {
                    const p = getPlayerById(pid);
                    return (
                      <div key={pid} className="flex items-center gap-2">
                        {(p as Player)?.photo ? (
                          <img
                            src={(p as Player).photo}
                            alt=""
                            className="w-7 h-7 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-surface flex items-center justify-center text-xs font-bold text-primary">
                            {getPlayerName(pid)[0]}
                          </div>
                        )}
                        <span className="text-sm text-text">
                          {getPlayerName(pid)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Matches history */}
      {matches.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-text">Partidas</h2>
          {matches.map((match, i) => (
            <div key={match._id} className="card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-text-muted">Partida {i + 1}</span>
                <span
                  className={`badge ${match.status === "ongoing" ? "badge-red" : "badge-gray"}`}
                >
                  {match.status === "ongoing" ? "Em andamento" : "Encerrada"}
                </span>
              </div>

              <div className="flex items-center justify-center gap-6">
                <div className="text-center">
                  <p className="text-xs text-text-muted mb-1">Time A</p>
                  <p
                    className={`text-3xl font-bold ${match.winner === "A" ? "text-primary" : "text-text"}`}
                  >
                    {match.teamA?.score ?? 0}
                  </p>
                </div>
                <span className="text-text-muted text-xl font-light">×</span>
                <div className="text-center">
                  <p className="text-xs text-text-muted mb-1">Time B</p>
                  <p
                    className={`text-3xl font-bold ${match.winner === "B" ? "text-primary" : "text-text"}`}
                  >
                    {match.teamB?.score ?? 0}
                  </p>
                </div>
              </div>

              {match.status === "ongoing" && (
                <Link
                  to={`/scoreboard/${match._id}`}
                  className="btn-primary w-full mt-3 py-2 flex items-center justify-center gap-2"
                >
                  <Tv2 size={15} /> Abrir Placar
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
