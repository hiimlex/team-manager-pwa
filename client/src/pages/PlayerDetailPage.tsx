import { playersApi } from "@/services/api";
import { useAuthStore } from "@/store/auth";
import type { Player, PlayerAffinity } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Camera, Edit2, Heart, HeartOff, Save } from "lucide-react";
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate, useParams } from "react-router-dom";

const STAT_LABELS: Record<string, string> = {
  setting: "Levantamento",
  passing: "Passe",
  attack: "Ataque",
  blocking: "Bloqueio",
  physical: "Físico",
  technique: "Técnica",
  gameVision: "Visão de Jogo",
};

export function PlayerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { player: me, role } = useAuthStore();
  const fileRef = useRef<HTMLInputElement>(null);

  const [editing, setEditing] = useState(false);
  const [editStats, setEditStats] = useState<Record<string, number>>({});

  const { data: player, isLoading } = useQuery<Player>({
    queryKey: ["player", id],
    queryFn: () => playersApi.getById(id!),
  });

  const saveMutation = useMutation({
    mutationFn: () => playersApi.update(id!, { stats: editStats }),
    onSuccess: () => {
      toast.success("Stats atualizados!");
      qc.invalidateQueries({ queryKey: ["player", id] });
      qc.invalidateQueries({ queryKey: ["players"] });
      setEditing(false);
    },
    onError: () => toast.error("Erro ao salvar"),
  });

  const photoMutation = useMutation({
    mutationFn: (file: File) => playersApi.uploadPhoto(id!, file),
    onSuccess: () => {
      toast.success("Foto atualizada!");
      qc.invalidateQueries({ queryKey: ["player", id] });
    },
    onError: () => toast.error("Erro ao enviar foto"),
  });

  function startEdit() {
    setEditStats({ ...player!.stats });
    setEditing(true);
  }

  const canEdit = role === "admin" || role === "moderator" || me?._id === id;
  // Stats feed the team draw and rankings, so only staff can change them
  const canEditStats = role === "admin" || role === "moderator";

  if (isLoading)
    return (
      <div className="text-center py-12 text-text-muted">Carregando...</div>
    );
  if (!player)
    return (
      <div className="text-center py-12 text-text-muted">
        Jogador não encontrado
      </div>
    );

  const winRate =
    player.matchesPlayed > 0
      ? Math.round((player.wins / player.matchesPlayed) * 100)
      : 0;

  return (
    <div className="space-y-5">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-text-muted hover:text-text text-sm"
      >
        <ArrowLeft size={16} /> Voltar
      </button>

      {/* Profile header */}
      <div className="card flex items-center gap-4">
        <div className="relative">
          {player.photo ? (
            <img
              src={player.photo}
              alt={player.nickname}
              className="w-20 h-20 rounded-2xl object-cover border-2 border-border"
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-hover flex items-center justify-center text-3xl font-bold text-primary border-2 border-border">
              {player.nickname[0].toUpperCase()}
            </div>
          )}
          {canEdit && (
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary flex items-center justify-center"
            >
              <Camera size={13} className="text-white" />
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) =>
              e.target.files?.[0] && photoMutation.mutate(e.target.files[0])
            }
          />
        </div>

        <div className="flex-1">
          <h1 className="text-xl font-bold text-text">{player.nickname}</h1>
          <p className="text-sm text-text-muted">{player.name}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="badge-gray capitalize">{player.position}</span>
            <span className="badge-gray">
              {player.gender === "M" ? "♂" : "♀"}
            </span>
            {player.height && (
              <span className="badge-gray">{player.height}cm</span>
            )}
          </div>
        </div>

        <div className="text-right">
          <p className="text-3xl font-bold text-primary">
            {player.overall.toFixed(1)}
          </p>
          <p className="text-xs text-text-muted">overall</p>
        </div>
      </div>

      {/* Career stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center">
          <p className="text-xl font-bold text-success">{player.wins}</p>
          <p className="text-xs text-text-muted">Vitórias</p>
        </div>
        <div className="card text-center">
          <p className="text-xl font-bold text-primary">{winRate}%</p>
          <p className="text-xs text-text-muted">Win Rate</p>
        </div>
        <div className="card text-center">
          <p className="text-xl font-bold text-text">{player.matchesPlayed}</p>
          <p className="text-xs text-text-muted">Partidas</p>
        </div>
      </div>

      {/* Stats */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-text">Stats</h2>
          {canEditStats && !editing && (
            <button
              onClick={startEdit}
              className="btn-ghost py-1 px-3 text-xs gap-1.5"
            >
              <Edit2 size={13} /> Editar
            </button>
          )}
          {editing && (
            <button
              onClick={() => saveMutation.mutate()}
              className="btn-primary py-1 px-3 text-xs gap-1.5"
              disabled={saveMutation.isPending}
            >
              <Save size={13} /> Salvar
            </button>
          )}
        </div>

        {Object.entries(STAT_LABELS).map(([key, label]) => (
          <div key={key}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-text-muted">{label}</span>
              <span className="text-sm font-semibold text-text">
                {editing ? editStats[key] : (player.stats as any)[key]}
              </span>
            </div>
            {editing ? (
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={editStats[key] ?? 5}
                onChange={(e) =>
                  setEditStats((s) => ({ ...s, [key]: Number(e.target.value) }))
                }
                className="w-full accent-primary"
              />
            ) : (
              <div className="w-full h-2 bg-hover rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{
                    width: `${((player.stats as any)[key] / 10) * 100}%`,
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Affinities */}
      <AffinitySection playerId={id!} canEdit={canEdit} />
    </div>
  );
}

function AffinitySection({
  playerId,
  canEdit,
}: {
  playerId: string;
  canEdit: boolean;
}) {
  const { data: affinities = [], refetch } = useQuery<PlayerAffinity[]>({
    queryKey: ["affinities", playerId],
    queryFn: () => playersApi.getAffinities(playerId),
  });

  const { data: groupPlayers = [] } = useQuery<Player[]>({
    queryKey: ["players", "group"],
    queryFn: () => playersApi.getMyGroup(),
  });

  const addMutation = useMutation({
    mutationFn: (targetId: string) =>
      playersApi.addAffinity(playerId, targetId),
    onSuccess: () => {
      toast.success("Afinidade adicionada!");
      refetch();
    },
    onError: (e: any) => toast.error(e.response?.data?.error || "Erro"),
  });

  const removeMutation = useMutation({
    mutationFn: (targetId: string) =>
      playersApi.removeAffinity(playerId, targetId),
    onSuccess: () => {
      toast.success("Removida");
      refetch();
    },
  });

  const affinityIds = new Set(
    affinities.map((a) =>
      typeof a.player === "string" ? a.player : (a.player as Player)._id,
    ),
  );

  const eligible = (groupPlayers as Player[]).filter(
    (p) => p._id !== playerId && !affinityIds.has(p._id),
  );

  return (
    <div className="card space-y-3">
      <h2 className="font-semibold text-text flex items-center gap-2">
        <Heart size={16} className="text-primary" /> Afinidades
      </h2>

      {affinities.length === 0 && (
        <p className="text-xs text-text-muted">Nenhuma afinidade cadastrada</p>
      )}

      {affinities.map((a) => {
        const p = typeof a.player === "string" ? null : (a.player as Player);
        const pid =
          typeof a.player === "string" ? a.player : (a.player as Player)._id;
        return (
          <div key={pid} className="flex items-center gap-3">
            {p?.photo ? (
              <img
                src={p.photo}
                alt={p.nickname}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-hover flex items-center justify-center text-xs font-bold text-primary">
                {p?.nickname?.[0] ?? "?"}
              </div>
            )}
            <div className="flex-1">
              <Link
                to={`/players/${pid}`}
                className="text-sm font-medium text-text hover:text-primary"
              >
                {p?.nickname ?? pid}
              </Link>
              {a.total > 0 && (
                <p className="text-xs text-text-muted">
                  {a.winRate}% win rate juntos ({a.wins}/{a.total})
                </p>
              )}
            </div>
            {canEdit && (
              <button
                onClick={() => removeMutation.mutate(pid)}
                className="text-text-muted hover:text-primary transition-colors p-1"
              >
                <HeartOff size={14} />
              </button>
            )}
          </div>
        );
      })}

      {canEdit && eligible.length > 0 && (
        <select
          className="input text-sm"
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) {
              addMutation.mutate(e.target.value);
              e.target.value = "";
            }
          }}
        >
          <option value="" disabled>
            + Adicionar afinidade...
          </option>
          {eligible.map((p) => (
            <option key={p._id} value={p._id}>
              {p.nickname}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
