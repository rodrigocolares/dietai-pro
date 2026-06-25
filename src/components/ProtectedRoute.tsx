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
  if (allow && roles.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-2 p-6 text-center">
        <p className="text-lg font-medium">Seu usuário ainda não tem um perfil de acesso.</p>
        <p className="text-sm text-muted-foreground">Entre em contato com o suporte para liberar seu acesso.</p>
      </div>
    );
  }
  if (allow && !roles.some((r) => allow.includes(r) || r === "super_admin" || r === "admin")) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-2 p-6 text-center">
        <p className="text-lg font-medium">Acesso negado</p>
        <p className="text-sm text-muted-foreground">
          Este recurso não está disponível para o seu perfil ({roles.join(", ") || "sem perfil"}).
        </p>
      </div>
    );
  }
  return children;
}
