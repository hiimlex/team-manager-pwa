import { useAuthStore } from "@/store/auth";
import clsx from "clsx";
import {
  Code2,
  LayoutDashboard,
  Settings,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Início" },
  { to: "/players", icon: Users, label: "Jogadores" },
  { to: "/rachas", icon: Zap, label: "Rachas" },
  { to: "/rankings", icon: Trophy, label: "Ranking" },
  { to: "/scripts", icon: Code2, label: "Scripts", adminOnly: true },
  { to: "/group", icon: Settings, label: "Grupo", adminOnly: true },
];

export function Layout() {
  const { group, role, player } = useAuthStore();

  return (
    <div className="flex flex-col min-h-dvh">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-surface border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-primary font-bold text-lg">🏐</span>
          <div>
            <p className="text-sm font-semibold text-text leading-none">
              {group?.name ?? "Racha Vôlei"}
            </p>
            <p className="text-xs text-text-muted">{player?.nickname}</p>
          </div>
        </div>
        <span
          className={clsx(
            "badge text-xs capitalize",
            role === "admin"
              ? "badge-red"
              : role === "moderator"
                ? "badge-green"
                : "badge-gray",
          )}
        >
          {role}
        </span>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-4 py-6 max-w-2xl w-full mx-auto">
        <Outlet />
      </main>

      {/* Bottom nav */}
      <nav className="sticky bottom-0 bg-surface border-t border-border">
        <div className="flex items-center justify-around px-2 py-2 max-w-2xl mx-auto">
          {navItems
            .filter(
              (item) =>
                !item.adminOnly || role === "admin" || role === "moderator",
            )
            .map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  clsx(
                    "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors text-xs",
                    isActive
                      ? "text-primary"
                      : "text-text-muted hover:text-text",
                  )
                }
              >
                <Icon size={20} />
                <span>{label}</span>
              </NavLink>
            ))}
        </div>
      </nav>
    </div>
  );
}
