import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import PoliciesPage from "./pages/PoliciesPage";
import PolicyDetail from "./pages/PolicyDetail";
import RulesPage from "./pages/RulesPage";
import EvaluationsPage from "./pages/EvaluationsPage";
import LogsPage from "./pages/LogsPage";
import BulkEvaluatePage from "./pages/BulkEvaluatePage";
import AIGeneratorPage from "./pages/AIGeneratorPage";

function PrivateRoute({ children }) {
  const { token } = useAuthStore();
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="ai-generator" element={<AIGeneratorPage />} />
        <Route path="policies" element={<PoliciesPage />} />
        <Route path="policies/:id" element={<PolicyDetail />} />
        <Route path="rules" element={<RulesPage />} />
        <Route path="bulk-evaluate" element={<BulkEvaluatePage />} />
        <Route path="evaluations" element={<EvaluationsPage />} />
        <Route path="logs" element={<LogsPage />} />
        
      </Route>
    </Routes>
  );
}
