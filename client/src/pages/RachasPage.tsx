import { RachaBuilderModal } from "@/components/rachas/RachaBuilderModal";
import { rachasApi } from "@/services/api";
import { useAuthStore } from "@/store/auth";
import type { RachaSession } from "@/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock, Play, Plus, Users } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

export function RachasPage() {
  const { group, role } = useAuthStore();
  const [showBuilder, setShowBuilder] = useState(false);
  const qc = useQueryClient();

  const { data: rachas = [], isLoading } = useQuery<RachaSession[]>({
    queryKey: ["rachas", group?._id],
    queryFn: () => rachasApi.listByGroup(group!._id),
    enabled: !!group,
  });

  const activeRacha = rachas.find((r) => r.status === "active");

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text">Rachas</h1>
        {(role === "admin" || role === "moderator") && !activeRacha && (
          <button
            onClick={() => setShowBuilder(true)}
            className="btn-primary gap-1.5 py-1.5"
          >
            <Plus size={16} /> Novo
          </button>
        )}
      </div>

      {activeRacha && (
        <div className="card border-primary/40 bg-primary/10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <p className="text-sm font-semibold text-primary">
              Racha em andamento
            </p>
          </div>
          <Link
            to={`/rachas/${activeRacha._id}`}
            className="btn-primary w-full py-2.5 flex items-center justify-center gap-2"
          >
            <Play size={16} /> Ir para o Racha
          </Link>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card animate-pulse h-20 bg-hover" />
          ))}
        </div>
      ) : rachas.length === 0 ? (
        <div className="text-center py-12 text-text-muted">
          <p className="text-4xl mb-3">🏐</p>
          <p>Nenhum racha ainda</p>
          {(role === "admin" || role === "moderator") && (
            <button
              onClick={() => setShowBuilder(true)}
              className="btn-primary mt-4"
            >
              Iniciar primeiro racha
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {rachas.map((racha) => (
            <Link
              key={racha._id}
              to={`/rachas/${racha._id}`}
              className="card hover:border-primary/40 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`badge ${racha.status === "active" ? "badge-red" : "badge-gray"}`}
                    >
                      {racha.status === "active" ? "Ao vivo" : "Encerrado"}
                    </span>
                    <span className="badge-gray capitalize">
                      {racha.type === "quartet" ? "Quarteto" : "Dupla"}
                    </span>
                  </div>
                  <p className="text-sm text-text mt-1">
                    {new Date(racha.date).toLocaleDateString("pt-BR", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </p>
                </div>
                <div className="text-right text-xs text-text-muted space-y-1">
                  <div className="flex items-center gap-1 justify-end">
                    <Users size={12} /> {(racha.players as any[]).length}
                  </div>
                  <div className="flex items-center gap-1 justify-end">
                    <Clock size={12} /> {(racha.matches as any[]).length}{" "}
                    partidas
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showBuilder && (
        <RachaBuilderModal
          onClose={() => setShowBuilder(false)}
          onSuccess={(_id) => {
            qc.invalidateQueries({ queryKey: ["rachas"] });
            setShowBuilder(false);
          }}
        />
      )}
    </div>
  );
}
