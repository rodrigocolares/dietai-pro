import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Apple, LogOut } from "lucide-react";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, roles, signOut } = useAuth();
  const nav = useNavigate();
  const isNutri = roles.includes("nutricionista") || roles.includes("admin");

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center">
              <Apple className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold">DietAI <span className="text-primary">Pro</span></span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            {user && !isNutri && (
              <>
                <Link to="/area" className="hover:text-primary">Minha área</Link>
                <Link to="/questionario" className="hover:text-primary">Questionário</Link>
                <Link to="/check-in" className="hover:text-primary">Check-in</Link>
                <Link to="/chat" className="hover:text-primary">Chat IA</Link>
              </>
            )}
            {user && isNutri && (
              <>
                <Link to="/nutri" className="hover:text-primary">Dashboard</Link>
                <Link to="/nutri/clientes" className="hover:text-primary">Clientes</Link>
                <Link to="/nutri/dietas" className="hover:text-primary">Dietas</Link>
                <Link to="/nutri/alimentos" className="hover:text-primary">Alimentos</Link>
                <Link to="/nutri/indicadores" className="hover:text-primary">Indicadores</Link>
                <Link to="/nutri/emails" className="hover:text-primary">E-mails</Link>
              </>
            )}
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <Button variant="ghost" size="sm" onClick={async () => { await signOut(); nav("/auth"); }}>
                <LogOut className="w-4 h-4" /> Sair
              </Button>
            ) : (
              <Button size="sm" onClick={() => nav("/auth")}>Entrar</Button>
            )}
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
