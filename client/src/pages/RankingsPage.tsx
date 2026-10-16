import { rankingsApi } from "@/services/api";
import { useAuthStore } from "@/store/auth";
import type { DuoRanking, RankingPlayer } from "@/types";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { Trophy } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

type Tab = "players" | "winners" | "duos";

const MEDAL = ["🥇", "🥈", "🥉"];
const MEDAL_COLOR = ["#FFD700", "#C0C0C0", "#CD7F32"];

export function RankingsPage() {
  const [tab, setTab] = useState<Tab>("winners");
  const { group } = useAuthStore();

  const { data: topWinners = [] } = useQuery({
    queryKey: ["rankings", "top-winners", group?._id],
    queryFn: () => rankingsApi.topWinners(group?._id),
    enabled: !!group,
  });

  const { data: topPlayers = [] } = useQuery({
    queryKey: ["rankings", "players", group?._id],
    queryFn: () => rankingsApi.players(group?._id),
    enabled: !!group,
  });

  const { data: duos = [] } = useQuery({
    queryKey: ["rankings", "duos", group?._id],
    queryFn: () => rankingsApi.duos(group?._id),
    enabled: !!group,
  });

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-text flex items-center gap-2">
        <Trophy size={22} className="text-primary" /> Rankings
      </h1>

      {/* Tabs */}
      <div className="flex bg-surface border border-border rounded-xl p-1 gap-1">
        {(
          [
            { key: "winners", label: "🏆 Vencedores" },
            { key: "players", label: "⭐ Jogadores" },
            { key: "duos", label: "🤝 Duplas" },
          ] as { key: Tab; label: string }[]
        ).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={clsx(
              "flex-1 py-2 text-xs font-medium rounded-lg transition-colors",
              tab === key
                ? "bg-primary text-white"
                : "text-text-muted hover:text-text",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Top Winners */}
      {tab === "winners" && (
        <div className="space-y-3">
          {topWinners.length === 0 ? (
            <p className="text-center text-text-muted py-12">Sem dados ainda</p>
          ) : (
            topWinners.map((p: any, i: number) => (
              <Link
                key={p._id}
                to={`/players/${p._id}`}
                className="card flex items-center gap-3 hover:border-primary/40 transition-colors"
              >
                <span
                  className="text-xl w-8 text-center"
                  style={{ color: i < 3 ? MEDAL_COLOR[i] : undefined }}
                >
                  {i < 3 ? MEDAL[i] : `#${i + 1}`}
                </span>
                {p.photo ? (
                  <img
                    src={p.photo}
                    alt={p.nickname}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-hover flex items-center justify-center text-base font-bold text-primary">
                    {p.nickname[0]}
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-medium text-text">{p.nickname}</p>
                  <p className="text-xs text-text-muted">
                    {p.wins}V · {p.losses}D · {p.matchesPlayed} partidas
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">{p.wins}</p>
                  <p className="text-xs text-text-muted">vitórias</p>
                </div>
              </Link>
            ))
          )}
        </div>
      )}

      {/* Top Players by overall */}
      {tab === "players" && (
        <div className="space-y-3">
          {topPlayers.length === 0 ? (
            <p className="text-center text-text-muted py-12">Sem dados ainda</p>
          ) : (
            topPlayers.map((p: RankingPlayer, i: number) => (
              <Link
                key={p._id}
                to={`/players/${p._id}`}
                className="card flex items-center gap-3 hover:border-primary/40 transition-colors"
              >
                <span className="text-xs text-text-muted w-6 text-center font-mono">
                  #{i + 1}
                </span>
                {p.photo ? (
                  <img
                    src={p.photo}
                    alt={p.nickname}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-hover flex items-center justify-center text-base font-bold text-primary">
                    {p.nickname[0]}
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-medium text-text">{p.nickname}</p>
                  <p className="text-xs text-text-muted capitalize">
                    {p.position} · {p.winRate}% win rate
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-primary">
                    {p.overall.toFixed(1)}
                  </p>
                  <p className="text-xs text-text-muted">overall</p>
                </div>
              </Link>
            ))
          )}
        </div>
      )}

      {/* Duos ranking */}
      {tab === "duos" && (
        <div className="space-y-3">
          {duos.length === 0 ? (
            <p className="text-center text-text-muted py-12">
              Sem dados de duplas ainda
            </p>
          ) : (
            (duos as DuoRanking[]).map((duo, i) => (
              <div key={i} className="card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-text-muted">#{i + 1}</span>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary">
                      {duo.winRate}%
                    </p>
                    <p className="text-xs text-text-muted">
                      {duo.wins}/{duo.total}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {duo.players.map((p, pi) => (
                    <div key={p._id} className="flex items-center gap-2">
                      {pi > 0 && <span className="text-text-muted">+</span>}
                      {p.photo ? (
                        <img
                          src={p.photo}
                          alt={p.nickname}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-hover flex items-center justify-center text-xs font-bold text-primary">
                          {p.nickname[0]}
                        </div>
                      )}
                      <span className="text-sm text-text">{p.nickname}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
