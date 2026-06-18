import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Apple, Brain, ClipboardCheck, FileCheck2, MessageSquare, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import AppShell from "@/components/AppShell";

export default function Landing() {
  const { user, roles } = useAuth();
  const isNutri = roles.includes("nutricionista") || roles.includes("admin");

  return (
    <AppShell>
      <section className="text-center py-12 md:py-20">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6">
          <ShieldCheck className="w-3 h-3" /> Sempre revisado por nutricionista
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
          Dietas personalizadas com <span className="text-primary">IA</span>,<br className="hidden md:block" />
          aprovadas por quem entende.
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          A plataforma DietAI Pro gera planos alimentares, lista de compras e orientações
          personalizadas — com revisão obrigatória do nutricionista antes de chegar até você.
        </p>
        <div className="flex gap-3 justify-center">
          {!user ? (
            <>
              <Button asChild size="lg"><Link to="/auth">Começar agora</Link></Button>
              <Button asChild size="lg" variant="outline"><Link to="/auth">Sou nutricionista</Link></Button>
            </>
          ) : (
            <Button asChild size="lg"><Link to={isNutri ? "/nutri" : "/area"}>Acessar minha área</Link></Button>
          )}
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-6 py-10">
        {[
          { i: ClipboardCheck, t: "Questionário inteligente", d: "Coleta completa de hábitos, restrições e objetivos." },
          { i: Brain, t: "Dieta gerada por IA", d: "Plano alimentar, macros e lista de compras em segundos." },
          { i: FileCheck2, t: "Revisão profissional", d: "Nutricionista valida e ajusta antes de liberar o PDF." },
          { i: Apple, t: "Área do cliente", d: "Acesso à dieta aprovada, check-ins e histórico." },
          { i: MessageSquare, t: "Chat com IA", d: "Tire dúvidas a qualquer momento, com base na sua dieta." },
          { i: ShieldCheck, t: "Seguro e privado", d: "Dados protegidos com criptografia e controle de acesso." },
        ].map(({ i: Icon, t, d }) => (
          <div key={t} className="p-6 rounded-xl bg-card border shadow-soft">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-semibold mb-1">{t}</h3>
            <p className="text-sm text-muted-foreground">{d}</p>
          </div>
        ))}
      </section>
    </AppShell>
  );
}
