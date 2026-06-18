import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, allow }: { children: JSX.Element; allow?: ("admin" | "nutricionista" | "cliente")[] }) {
  const { user, roles, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Carregando...</div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (allow && !roles.some((r) => allow.includes(r))) return <Navigate to="/" replace />;
  return children;
}
