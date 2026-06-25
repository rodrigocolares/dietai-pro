import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";

type Role = "super_admin" | "admin" | "nutricionista" | "cliente";

export default function ProtectedRoute({
  children,
  allow,
}: {
  children: JSX.Element;
  allow?: Role[];
}) {
  const { user, roles, loading, rolesLoading } = useAuth();

  if (loading || (user && rolesLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Carregando...
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (allow && !roles.some((r) => allow.includes(r) || r === "super_admin" || r === "admin")) {
    return <Navigate to="/" replace />;
  }
  return children;
}
