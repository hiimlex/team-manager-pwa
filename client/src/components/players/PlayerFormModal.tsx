import { authApi } from "@/services/api";
import { useAuthStore } from "@/store/auth";
import { useMutation } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

const POSITIONS = [
  { value: "universal", label: "Universal" },
  { value: "setter", label: "Levantador" },
  { value: "outside", label: "Ponteiro" },
  { value: "middle", label: "Central" },
  { value: "opposite", label: "Oposto" },
  { value: "libero", label: "Líbero" },
];

export function PlayerFormModal({ onClose, onSuccess }: Props) {
  const { group } = useAuthStore();
  const [form, setForm] = useState({
    name: "",
    nickname: "",
    gender: "M",
    position: "universal",
    age: "",
    height: "",
  });

  const mutation = useMutation({
    mutationFn: async () => {
      return authApi.join({
        inviteCode: group!.inviteCode,
        name: form.name,
        nickname: form.nickname,
        gender: form.gender as "M" | "F",
        height: form.height ? Number(form.height) : undefined,
      });
    },
    onSuccess: () => {
      toast.success("Jogador adicionado!");
      onSuccess();
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Erro ao adicionar jogador");
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    mutation.mutate();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end justify-center sm:items-center p-4">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-semibold text-text">Novo Jogador</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <input
            className="input"
            placeholder="Nome completo"
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <input
            className="input"
            placeholder="Apelido"
            required
            value={form.nickname}
            onChange={(e) =>
              setForm((f) => ({ ...f, nickname: e.target.value }))
            }
          />

          <div className="grid grid-cols-2 gap-3">
            <select
              className="input"
              value={form.gender}
              onChange={(e) =>
                setForm((f) => ({ ...f, gender: e.target.value }))
              }
            >
              <option value="M">Masculino</option>
              <option value="F">Feminino</option>
            </select>
            <select
              className="input"
              value={form.position}
              onChange={(e) =>
                setForm((f) => ({ ...f, position: e.target.value }))
              }
            >
              {POSITIONS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <input
              className="input"
              type="number"
              placeholder="Idade"
              min="10"
              max="80"
              value={form.age}
              onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))}
            />
            <input
              className="input"
              type="number"
              placeholder="Altura (cm)"
              min="100"
              max="250"
              value={form.height}
              onChange={(e) =>
                setForm((f) => ({ ...f, height: e.target.value }))
              }
            />
          </div>

          <button
            type="submit"
            className="btn-primary w-full py-3"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Adicionando..." : "Adicionar Jogador"}
          </button>
        </form>
      </div>
    </div>
  );
}
