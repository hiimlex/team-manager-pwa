import { useSocket } from "@/hooks/useSocket";
import { matchesApi } from "@/services/api";
import { useAuthStore } from "@/store/auth";
import type { Match, Player } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { ArrowLeft, Maximize2, Minus } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

export function ScoreboardPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const { role } = useAuthStore();
  const qc = useQueryClient();
  const socket = useSocket();
  const canManage = role === "admin" || role === "moderator";

  const [bumpA, setBumpA] = useState(false);
  const [bumpB, setBumpB] = useState(false);
  const [tvMode, setTvMode] = useState(false);

  const { data: match, isLoading } = useQuery<Match>({
    queryKey: ["match", matchId],
    queryFn: () => matchesApi.getById(matchId!),
  });

  const scoreMutation = useMutation({
    mutationFn: ({ team, score }: { team: "A" | "B"; score: number }) =>
      matchesApi.updateScore(matchId!, { team, score }),
    onSuccess: (updated) => qc.setQueryData(["match", matchId], updated),
  });

  // Real-time score updates via socket
  useEffect(() => {
    if (!socket) return;
    const handler = (data: any) => {
      if (data.matchId === matchId) {
        qc.invalidateQueries({ queryKey: ["match", matchId] });
      }
    };
    socket.on("match:score", handler);
    return () => {
      socket.off("match:score", handler);
    };
  }, [socket, matchId, qc]);

  function addPoint(team: "A" | "B") {
    if (!match || match.status === "finished") return;
    const score = (team === "A" ? match.teamA.score : match.teamB.score) + 1;
    scoreMutation.mutate({ team, score });
    if (team === "A") {
      setBumpA(true);
      setTimeout(() => setBumpA(false), 400);
    } else {
      setBumpB(true);
      setTimeout(() => setBumpB(false), 400);
    }
  }

  const getNames = (team: { players: string[] | Player[]; score: number }) =>
    (team.players as Player[])
      .map((p) => (p as Player).nickname ?? "?")
      .join(", ");

  if (isLoading)
    return (
      <div className="min-h-dvh bg-bg flex items-center justify-center text-text-muted">
        Carregando...
      </div>
    );
  if (!match)
    return (
      <div className="min-h-dvh bg-bg flex items-center justify-center text-text-muted">
        Partida não encontrada
      </div>
    );

  const a = match.teamA.score;
  const b = match.teamB.score;
  const isDeuce = a >= 11 && b >= 11;
  const isFinished = match.status === "finished";

  return (
    <div
      className={clsx(
        "min-h-dvh bg-bg flex flex-col",
        tvMode && "fixed inset-0 z-50",
      )}
    >
      {/* Top bar */}
      {!tvMode && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <Link
            to={`/rachas/${match.rachaSession}`}
            className="flex items-center gap-2 text-text-muted hover:text-text text-sm"
          >
            <ArrowLeft size={16} /> Voltar
          </Link>
          <button
            onClick={() => setTvMode(true)}
            className="flex items-center gap-1.5 text-text-muted hover:text-text text-sm"
          >
            <Maximize2 size={16} /> Modo TV
          </button>
        </div>
      )}

      {tvMode && (
        <button
          onClick={() => setTvMode(false)}
          className="absolute top-3 right-3 z-10 text-text-muted/50 hover:text-text text-xs"
        >
          ✕ Fechar
        </button>
      )}

      {/* Scoreboard */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 gap-6">
        {/* Status */}
        {isDeuce && !isFinished && (
          <div className="badge-red text-sm px-4 py-1.5 animate-pulse-slow font-semibold">
            DEUCE — vença por 2!
          </div>
        )}
        {isFinished && (
          <div className="text-center">
            <p className="text-sm text-text-muted mb-1">Vencedor</p>
            <p className="text-2xl font-bold text-primary">
              Time {match.winner} 🏆
            </p>
          </div>
        )}

        {/* Score display */}
        <div className="flex items-center gap-6 w-full max-w-xs">
          {/* Team A */}
          <div className="flex-1 text-center">
            <p className="text-xs text-text-muted uppercase tracking-widest mb-2">
              Time A
            </p>
            <div
              className={clsx(
                "text-8xl font-black transition-transform leading-none mb-2",
                match.winner === "A" ? "text-primary" : "text-text",
                bumpA && "score-bump",
              )}
            >
              {a}
            </div>
            <p className="text-xs text-text-muted truncate">
              {getNames(match.teamA)}
            </p>
            {canManage && !isFinished && (
              <div className="flex gap-2 mt-3 justify-center">
                <button
                  onClick={() => addPoint("A")}
                  className="w-12 h-12 rounded-full bg-primary text-white text-xl font-bold hover:bg-primary-hover transition-colors"
                >
                  +
                </button>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="text-3xl font-light text-text-muted">×</div>

          {/* Team B */}
          <div className="flex-1 text-center">
            <p className="text-xs text-text-muted uppercase tracking-widest mb-2">
              Time B
            </p>
            <div
              className={clsx(
                "text-8xl font-black transition-transform leading-none mb-2",
                match.winner === "B" ? "text-primary" : "text-text",
                bumpB && "score-bump",
              )}
            >
              {b}
            </div>
            <p className="text-xs text-text-muted truncate">
              {getNames(match.teamB)}
            </p>
            {canManage && !isFinished && (
              <div className="flex gap-2 mt-3 justify-center">
                <button
                  onClick={() => addPoint("B")}
                  className="w-12 h-12 rounded-full bg-primary text-white text-xl font-bold hover:bg-primary-hover transition-colors"
                >
                  +
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Score to win indicator */}
        {!isFinished && (
          <div className="flex gap-1.5">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-1">
                <div
                  className={clsx(
                    "w-2 h-2 rounded-full",
                    i < a ? "bg-primary" : "bg-hover",
                  )}
                />
                <div
                  className={clsx(
                    "w-2 h-2 rounded-full",
                    i < b ? "bg-white/60" : "bg-hover",
                  )}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Undo / correction bar (admin only) */}
      {canManage && !isFinished && !tvMode && (
        <div className="flex gap-3 p-4 border-t border-border">
          <button
            onClick={() =>
              scoreMutation.mutate({ team: "A", score: Math.max(0, a - 1) })
            }
            className="flex-1 btn-ghost py-2 text-xs gap-1"
          >
            <Minus size={12} /> Time A
          </button>
          <button
            onClick={() =>
              scoreMutation.mutate({ team: "B", score: Math.max(0, b - 1) })
            }
            className="flex-1 btn-ghost py-2 text-xs gap-1"
          >
            <Minus size={12} /> Time B
          </button>
        </div>
      )}
    </div>
  );
}
