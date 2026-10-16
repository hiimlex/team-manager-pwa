import { playersApi, rachasApi } from "@/services/api";
import { useAuthStore } from "@/store/auth";
import type { Player } from "@/types";
import { useMutation, useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { Check, RefreshCw, X } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

interface Props {
  onClose: () => void;
  onSuccess: (id: string) => void;
}

export function RachaBuilderModal({ onClose, onSuccess }: Props) {
  const { group } = useAuthStore();
  const navigate = useNavigate();
  const [type, setType] = useState<"quartet" | "doubles">(
    group?.modes?.[0] || "quartet",
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data: players = [] } = useQuery<Player[]>({
    queryKey: ["players", "group"],
    queryFn: () => playersApi.getMyGroup(),
  });

  const mutation = useMutation({
    mutationFn: () => rachasApi.create({ playerIds: [...selected], type }),
    onSuccess: (data) => {
      toast.success("Racha iniciado!");
      onSuccess(data.racha._id);
      navigate(`/rachas/${data.racha._id}`);
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.error || "Erro ao criar racha"),
  });

  function toggle(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const teamSize = type === "quartet" ? 4 : 2;
  const canCreate = selected.size >= teamSize * 2;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end justify-center p-0 sm:p-4 sm:items-center">
      <div className="bg-surface border border-border rounded-t-2xl sm:rounded-2xl w-full max-w-sm max-h-[90dvh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
          <h2 className="font-semibold text-text">Montar Racha</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text">
            <X size={20} />
          </button>
        </div>

        {/* Type selector — only show modes the group supports */}
        <div className="px-4 py-3 border-b border-border flex gap-2">
          {(["quartet", "doubles"] as const)
            .filter(
              (t) =>
                !group?.modes ||
                group.modes.includes(t) ||
                group.modes.length === 0,
            )
            .map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={clsx(
                  "flex-1 py-2 rounded-lg text-sm font-medium transition-colors",
                  type === t
                    ? "bg-primary text-white"
                    : "bg-hover text-text-muted hover:text-text",
                )}
              >
                {t === "quartet" ? "Quarteto (4×4)" : "Dupla (2×2)"}
              </button>
            ))}
        </div>

        {/* Player selection */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <p className="text-xs text-text-muted mb-2">
            Selecione os jogadores presentes — mín. {teamSize * 2}
            <span className="ml-2 text-primary font-medium">
              {selected.size} selecionados
            </span>
          </p>
          {players.map((player) => (
            <button
              key={player._id}
              onClick={() => toggle(player._id)}
              className={clsx(
                "w-full flex items-center gap-3 p-3 rounded-xl border transition-colors text-left",
                selected.has(player._id)
                  ? "border-primary bg-primary/10"
                  : "border-border bg-hover hover:border-border/80",
              )}
            >
              {player.photo ? (
                <img
                  src={player.photo}
                  alt={player.nickname}
                  className="w-9 h-9 rounded-full object-cover"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-surface flex items-center justify-center text-sm font-bold text-primary">
                  {player.nickname[0]}
                </div>
              )}
              <div className="flex-1">
                <p className="text-sm font-medium text-text">
                  {player.nickname}
                </p>
                <p className="text-xs text-text-muted capitalize">
                  {player.position} · {player.overall.toFixed(1)}
                </p>
              </div>
              {selected.has(player._id) && (
                <Check size={16} className="text-primary" />
              )}
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <button
            onClick={() => mutation.mutate()}
            disabled={!canCreate || mutation.isPending}
            className="btn-primary w-full py-3 gap-2"
          >
            {mutation.isPending ? (
              <>
                <RefreshCw size={16} className="animate-spin" /> Sorteando...
              </>
            ) : (
              "Sortear Times e Iniciar"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
