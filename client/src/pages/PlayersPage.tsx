import { PlayerFormModal } from "@/components/players/PlayerFormModal";
import { StatBar } from "@/components/players/StatBar";
import { playersApi } from "@/services/api";
import { useAuthStore } from "@/store/auth";
import type { Player } from "@/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, Plus, Search } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

export function PlayersPage() {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const { role } = useAuthStore();
  const qc = useQueryClient();

  const { data: players = [], isLoading } = useQuery<Player[]>({
    queryKey: ["players", "group"],
    queryFn: () => playersApi.getMyGroup(),
  });

  const filtered = players.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.nickname.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text">Jogadores</h1>
        {role === "admin" && (
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary gap-1.5 py-1.5"
          >
            <Plus size={16} /> Adicionar
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
        />
        <input
          className="input pl-9"
          placeholder="Buscar jogador..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card animate-pulse h-20 bg-hover" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-text-muted">
          <p className="text-4xl mb-3">🏐</p>
          <p>Nenhum jogador encontrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered
            .sort((a, b) => b.overall - a.overall)
            .map((player, i) => (
              <Link
                key={player._id}
                to={`/players/${player._id}`}
                className="card flex items-center gap-3 hover:border-primary/40 transition-colors"
              >
                {/* Rank */}
                <span className="w-6 text-center text-xs text-text-muted font-mono">
                  #{i + 1}
                </span>

                {/* Avatar */}
                {player.photo ? (
                  <img
                    src={player.photo}
                    alt={player.nickname}
                    className="w-11 h-11 rounded-full object-cover border border-border"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-hover flex items-center justify-center text-base font-bold text-primary border border-border">
                    {player.nickname[0].toUpperCase()}
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-text truncate">
                      {player.nickname}
                    </p>
                    <span className="badge-gray capitalize text-xs">
                      {player.position}
                    </span>
                  </div>
                  <div className="flex gap-3 mt-1">
                    <StatBar label="ATQ" value={player.stats.attack} />
                    <StatBar label="PSS" value={player.stats.passing} />
                    <StatBar label="FIS" value={player.stats.physical} />
                  </div>
                </div>

                {/* Overall */}
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">
                    {player.overall.toFixed(1)}
                  </p>
                  <p className="text-xs text-text-muted">
                    {player.wins}V / {player.losses}D
                  </p>
                </div>

                <ChevronRight size={14} className="text-text-muted" />
              </Link>
            ))}
        </div>
      )}

      {showForm && (
        <PlayerFormModal
          onClose={() => setShowForm(false)}
          onSuccess={() => qc.invalidateQueries({ queryKey: ["players"] })}
        />
      )}
    </div>
  );
}
