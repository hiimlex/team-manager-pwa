import { Layout } from "@/components/layout/Layout";
import { DashboardPage } from "@/pages/DashboardPage";
import { GroupPage } from "@/pages/GroupPage";
import { OnboardingPage } from "@/pages/OnboardingPage";
import { PlayerDetailPage } from "@/pages/PlayerDetailPage";
import { PlayersPage } from "@/pages/PlayersPage";
import { RachaDetailPage } from "@/pages/RachaDetailPage";
import { RachasPage } from "@/pages/RachasPage";
import { RankingsPage } from "@/pages/RankingsPage";
import { ScoreboardPage } from "@/pages/ScoreboardPage";
import { ScriptEditorPage } from "@/pages/ScriptEditorPage";
import { useAuthStore } from "@/store/auth";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore();
  return token ? <>{children}</> : <Navigate to="/" replace />;
}

export default function App() {
  const { token } = useAuthStore();

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route
          path="/"
          element={
            token ? <Navigate to="/dashboard" replace /> : <OnboardingPage />
          }
        />

        {/* Protected */}
        <Route
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/players" element={<PlayersPage />} />
          <Route path="/players/:id" element={<PlayerDetailPage />} />
          <Route path="/group" element={<GroupPage />} />
          <Route path="/rachas" element={<RachasPage />} />
          <Route path="/rachas/:id" element={<RachaDetailPage />} />
          <Route path="/rankings" element={<RankingsPage />} />
          <Route path="/scripts" element={<ScriptEditorPage />} />
        </Route>

        {/* Scoreboard (standalone, shareable) */}
        <Route path="/scoreboard/:matchId" element={<ScoreboardPage />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
