import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AppShell from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

type Plan = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  price_cents: number;
  currency: string;
  max_clients: number;
  max_diets_per_month: number;
  max_pdfs_per_month: number;
  features: Record<string, boolean>;
};

const fmt = (cents: number, cur: string) =>
  cents === 0 ? "Sob consulta" : new Intl.NumberFormat("pt-BR", { style: "currency", currency: cur }).format(cents / 100);

export default function Plans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  useEffect(() => {
    supabase.from("subscription_plans").select("*").eq("status", "active").order("sort_order")
      .then(({ data }) => setPlans((data as any) ?? []));
  }, []);

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-3">Planos do <span className="text-primary">DietAI Pro</span></h1>
          <p className="text-muted-foreground text-lg">Escolha o plano ideal para o seu consultório.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((p, i) => (
            <Card key={p.id} className={i === 1 ? "border-primary shadow-lg relative" : ""}>
              {i === 1 && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full">
                  Mais popular
                </span>
              )}
              <CardHeader>
                <CardTitle>{p.name}</CardTitle>
                <CardDescription>{p.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-3xl font-bold">{fmt(p.price_cents, p.currency)}</span>
                  {p.price_cents > 0 && <span className="text-muted-foreground text-sm">/mês</span>}
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <Feature ok>{p.max_clients === 0 ? "Clientes ilimitados" : `Até ${p.max_clients} clientes`}</Feature>
                <Feature ok>{p.max_diets_per_month === 0 ? "Dietas ilimitadas/mês" : `${p.max_diets_per_month} dietas/mês`}</Feature>
                <Feature ok>{p.max_pdfs_per_month === 0 ? "PDFs ilimitados" : `${p.max_pdfs_per_month} PDFs/mês`}</Feature>
                <Feature ok={!!p.features?.ai_chat}>Chat com IA</Feature>
                <Feature ok={!!p.features?.email}>E-mails automáticos</Feature>
                <Feature ok={!!p.features?.whatsapp}>Integração WhatsApp</Feature>
                <Feature ok={!!p.features?.multi_user}>Múltiplos usuários</Feature>
                <Feature ok={!!p.features?.sla}>SLA dedicado</Feature>
                <Button asChild className="w-full mt-4" variant={i === 1 ? "default" : "outline"}>
                  <Link to="/auth">{p.code === "enterprise" ? "Falar com vendas" : "Começar agora"}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

function Feature({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <div className={`flex items-center gap-2 ${ok ? "" : "opacity-40 line-through"}`}>
      <Check className="w-4 h-4 text-primary" /> {children}
    </div>
  );
}
