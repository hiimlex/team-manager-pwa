import { duosApi, groupsApi } from "@/services/api";
import { useAuthStore } from "@/store/auth";
import type { Duo, Group, Player } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { Camera, Check, Copy, Shield, Users, X } from "lucide-react";
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

export function GroupPage() {
  const { group: g, role, logout, updateGroup } = useAuthStore();
  const qc = useQueryClient();
  const emblemRef = useRef<HTMLInputElement>(null);

  const { data: group, isLoading } = useQuery<Group>({
    queryKey: ["group", g?._id],
    queryFn: () => groupsApi.getById(g!._id),
    enabled: !!g,
  });

  const removeMutation = useMutation({
    mutationFn: (playerId: string) => groupsApi.removePlayer(g!._id, playerId),
    onSuccess: () => {
      toast.success("Jogador removido");
      qc.invalidateQueries({ queryKey: ["group"] });
      qc.invalidateQueries({ queryKey: ["players"] });
    },
  });

  const promoteMutation = useMutation({
    mutationFn: (playerId: string) =>
      groupsApi.promoteModerator(g!._id, playerId),
    onSuccess: () => {
      toast.success("Promovido a moderador");
      qc.invalidateQueries({ queryKey: ["group"] });
    },
  });

  const emblemMutation = useMutation({
    mutationFn: (file: File) => groupsApi.uploadEmblem(g!._id, file),
    onSuccess: (data) => {
      toast.success("Emblema atualizado!");
      qc.setQueryData(["group", g?._id], (old: any) => ({
        ...old,
        emblem: data.emblem,
      }));
      if (group) updateGroup({ ...group, emblem: data.emblem });
    },
    onError: () => toast.error("Erro ao enviar emblema"),
  });

  function copyInvite() {
    navigator.clipboard.writeText(group?.inviteCode ?? "");
    toast.success("Código copiado!");
  }

  if (isLoading)
    return (
      <div className="text-center py-12 text-text-muted">Carregando...</div>
    );
  if (!group)
    return (
      <div className="text-center py-12 text-text-muted">
        Grupo não encontrado
      </div>
    );

  const players = group.players as Player[];
  const adminId =
    typeof group.admin === "string" ? group.admin : (group.admin as Player)._id;
  const canManage = role === "admin" || role === "moderator";

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-text">Grupo</h1>

      {/* Group info with emblem */}
      <div className="card space-y-3">
        <div className="flex items-center gap-4">
          {/* Emblem */}
          <div className="relative flex-shrink-0">
            {group.emblem ? (
              <img
                src={group.emblem}
                alt="Emblema"
                className="w-16 h-16 rounded-2xl object-cover border border-border"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-hover border border-border flex items-center justify-center text-2xl">
                🏐
              </div>
            )}
            {canManage && (
              <button
                onClick={() => emblemRef.current?.click()}
                disabled={emblemMutation.isPending}
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center"
              >
                <Camera size={11} className="text-white" />
              </button>
            )}
            <input
              ref={emblemRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) =>
                e.target.files?.[0] && emblemMutation.mutate(e.target.files[0])
              }
            />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-lg font-bold text-text truncate">{group.name}</p>
            {group.description && (
              <p className="text-xs text-text-muted mt-0.5 line-clamp-2">
                {group.description}
              </p>
            )}
            <p className="text-xs text-text-muted mt-1 capitalize">
              {(group.modes ?? ["quartet"])
                .map((m) =>
                  m === "quartet" ? "Quarteto (4×4)" : "Dupla (2×2)",
                )
                .join(" + ")}
            </p>
          </div>
        </div>

        {/* Invite code */}
        <div>
          <p className="text-xs text-text-muted mb-1">Código de convite</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-hover px-3 py-2 rounded-lg text-sm font-mono tracking-widest text-primary">
              {group.inviteCode}
            </code>
            <button onClick={copyInvite} className="btn-ghost p-2">
              <Copy size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Players list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide flex items-center gap-1.5">
            <Users size={14} /> {players.length} Jogadores
          </h2>
        </div>

        {players.map((player) => {
          const isMod = group.moderators.includes(player._id);
          const isAdmin = player._id === adminId;

          return (
            <div key={player._id} className="card flex items-center gap-3">
              {player.photo ? (
                <img
                  src={player.photo}
                  alt={player.nickname}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-hover flex items-center justify-center text-sm font-bold text-primary">
                  {player.nickname?.[0]}
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Link
                    to={`/players/${player._id}`}
                    className="text-sm font-medium text-text hover:text-primary transition-colors"
                  >
                    {player.nickname}
                  </Link>
                  {isAdmin && <span className="badge-red text-xs">Admin</span>}
                  {isMod && !isAdmin && (
                    <span className="badge-green text-xs">Mod</span>
                  )}
                </div>
                <p className="text-xs text-text-muted capitalize">
                  {player.position} · {player.overall?.toFixed(1)} overall
                </p>
              </div>

              {role === "admin" && !isAdmin && (
                <div className="flex gap-1">
                  {!isMod && (
                    <button
                      onClick={() => promoteMutation.mutate(player._id)}
                      className="p-1.5 rounded-lg hover:bg-hover text-text-muted hover:text-success transition-colors"
                      title="Promover a moderador"
                    >
                      <Shield size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => removeMutation.mutate(player._id)}
                    className="p-1.5 rounded-lg hover:bg-hover text-text-muted hover:text-primary transition-colors"
                    title="Remover do grupo"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Danger zone */}
      <div className="card border-border/50 space-y-2">
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">
          Conta
        </p>
        <button onClick={logout} className="btn-danger w-full py-2.5 text-sm">
          Sair do Grupo
        </button>
      </div>

      {/* Duos section */}
      {group.modes?.includes("doubles") && (
        <DuosSection groupId={g!._id} players={players} canManage={canManage} />
      )}
    </div>
  );
}

function DuosSection({
  groupId,
  players,
  canManage,
}: {
  groupId: string;
  players: Player[];
  canManage: boolean;
}) {
  const qc = useQueryClient();
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [duoName, setDuoName] = useState("");
  const [showForm, setShowForm] = useState(false);

  const { data: duos = [], isLoading } = useQuery<Duo[]>({
    queryKey: ["duos", groupId],
    queryFn: () => duosApi.listByGroup(groupId),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      duosApi.create({
        player1Id: p1,
        player2Id: p2,
        name: duoName || undefined,
      }),
    onSuccess: () => {
      toast.success("Dupla cadastrada!");
      qc.invalidateQueries({ queryKey: ["duos", groupId] });
      setP1("");
      setP2("");
      setDuoName("");
      setShowForm(false);
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.error || "Erro ao cadastrar dupla"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => duosApi.delete(id),
    onSuccess: () => {
      toast.success("Dupla removida");
      qc.invalidateQueries({ queryKey: ["duos", groupId] });
    },
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide">
          🤝 Duplas cadastradas
        </h2>
        {canManage && (
          <button
            onClick={() => setShowForm((s) => !s)}
            className={clsx(
              "btn-ghost py-1.5 px-3 text-xs gap-1",
              showForm && "border-primary text-primary",
            )}
          >
            {showForm ? <X size={13} /> : "+ Nova"}
          </button>
        )}
      </div>

      {showForm && (
        <div className="card space-y-3">
          <select
            className="input text-sm"
            value={p1}
            onChange={(e) => setP1(e.target.value)}
            required
          >
            <option value="">Jogador 1...</option>
            {players
              .filter((p) => p._id !== p2)
              .map((p) => (
                <option key={p._id} value={p._id}>
                  {p.nickname}
                </option>
              ))}
          </select>
          <select
            className="input text-sm"
            value={p2}
            onChange={(e) => setP2(e.target.value)}
            required
          >
            <option value="">Jogador 2...</option>
            {players
              .filter((p) => p._id !== p1)
              .map((p) => (
                <option key={p._id} value={p._id}>
                  {p.nickname}
                </option>
              ))}
          </select>
          <input
            className="input text-sm"
            placeholder="Nome da dupla (opcional)"
            value={duoName}
            onChange={(e) => setDuoName(e.target.value)}
          />
          <button
            className="btn-primary w-full py-2 text-sm gap-1.5"
            disabled={!p1 || !p2 || createMutation.isPending}
            onClick={() => createMutation.mutate()}
          >
            <Check size={14} /> Cadastrar Dupla
          </button>
        </div>
      )}

      {isLoading && (
        <div className="text-center py-4 text-text-muted text-sm">
          Carregando...
        </div>
      )}

      {!isLoading && duos.length === 0 && (
        <p className="text-xs text-text-muted text-center py-3">
          Nenhuma dupla cadastrada ainda
        </p>
      )}

      {duos.map((duo) => {
        const winRate =
          duo.matchesPlayed > 0
            ? Math.round((duo.wins / duo.matchesPlayed) * 100)
            : 0;
        return (
          <div key={duo._id} className="card flex items-center gap-3">
            <div className="flex -space-x-2">
              {duo.players.map((p) =>
                p.photo ? (
                  <img
                    key={p._id}
                    src={p.photo}
                    alt={p.nickname}
                    className="w-8 h-8 rounded-full object-cover border-2 border-surface"
                  />
                ) : (
                  <div
                    key={p._id}
                    className="w-8 h-8 rounded-full bg-hover border-2 border-surface flex items-center justify-center text-xs font-bold text-primary"
                  >
                    {p.nickname[0]}
                  </div>
                ),
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text truncate">
                {duo.name}
              </p>
              <p className="text-xs text-text-muted">
                {duo.wins}V · {duo.losses}D
                {duo.matchesPlayed > 0 && ` · ${winRate}% WR`}
              </p>
            </div>
            {canManage && (
              <button
                onClick={() => deleteMutation.mutate(duo._id)}
                className="p-1.5 rounded-lg hover:bg-hover text-text-muted hover:text-primary transition-colors"
              >
                <X size={13} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
