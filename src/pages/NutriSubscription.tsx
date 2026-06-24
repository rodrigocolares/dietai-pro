import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppShell from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

type Plan = {
  id: string; code: string; name: string;
  price_cents: number; currency: string;
  max_clients: number; max_diets_per_month: number; max_pdfs_per_month: number;
};
type Sub = {
  id: string; status: string; plan_id: string;
  current_period_start: string; current_period_end: string;
  cancel_at_period_end: boolean; provider: string | null;
};
type Usage = {
  active_clients: number; diets_generated: number;
  pdfs_generated: number; emails_sent: number; chat_messages: number;
};

const fmt = (cents: number, cur: string) =>
  cents === 0 ? "Sob consulta" : new Intl.NumberFormat("pt-BR", { style: "currency", currency: cur }).format(cents / 100);

export default function NutriSubscription() {
  const { user } = useAuth();
  const [orgId, setOrgId] = useState<string | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [sub, setSub] = useState<Sub | null>(null);
  const [history, setHistory] = useState<Sub[]>([]);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [clientsCount, setClientsCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: prof } = await supabase.from("profiles").select("organization_id").eq("id", user.id).maybeSingle();
      const oid = prof?.organization_id ?? null;
      setOrgId(oid);
      if (!oid) return;

      const [{ data: pl }, { data: subs }, { data: u }, { data: cli }] = await Promise.all([
        supabase.from("subscription_plans").select("*").order("sort_order"),
        supabase.from("subscriptions").select("*").eq("organization_id", oid).order("created_at", { ascending: false }),
        supabase.from("usage_counters").select("*").eq("organization_id", oid)
          .eq("period_year", new Date().getFullYear()).eq("period_month", new Date().getMonth() + 1).maybeSingle(),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("organization_id", oid),
      ]);
      setPlans((pl as any) ?? []);
      const list = (subs as any) ?? [];
      setSub(list[0] ?? null);
      setHistory(list);
      setUsage((u as any) ?? { active_clients: 0, diets_generated: 0, pdfs_generated: 0, emails_sent: 0, chat_messages: 0 });
      setClientsCount(cli?.length ?? 0);
    })();
  }, [user]);

  const currentPlan = plans.find((p) => p.id === sub?.plan_id);

  const changePlan = async (planId: string) => {
    if (!orgId) return;
    const { error } = await supabase.from("subscriptions").insert({
      organization_id: orgId, plan_id: planId, status: "active", provider: "manual",
    });
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    toast({ title: "Plano atualizado!" });
    location.reload();
  };

  const cancel = async () => {
    if (!sub) return;
    const { error } = await supabase.from("subscriptions").update({ cancel_at_period_end: true }).eq("id", sub.id);
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    toast({ title: "Cancelamento agendado para o fim do período." });
    location.reload();
  };

  const usagePct = (used: number, max: number) => (max === 0 ? 0 : Math.min(100, (used / max) * 100));

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Minha assinatura</h1>
          <p className="text-muted-foreground">Acompanhe seu plano, uso e limites.</p>
        </div>

        {currentPlan && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <CardTitle>Plano {currentPlan.name}</CardTitle>
                  <CardDescription>{fmt(currentPlan.price_cents, currentPlan.currency)}/mês</CardDescription>
                </div>
                <Badge variant={sub?.status === "active" ? "default" : "secondary"}>{sub?.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Período atual: {new Date(sub!.current_period_start).toLocaleDateString("pt-BR")} →{" "}
                {new Date(sub!.current_period_end).toLocaleDateString("pt-BR")}
                {sub?.cancel_at_period_end && <span className="ml-2 text-destructive">(cancelamento agendado)</span>}
              </div>

              <UsageRow label="Clientes" used={clientsCount} max={currentPlan.max_clients} pct={usagePct(clientsCount, currentPlan.max_clients)} />
              <UsageRow label="Dietas geradas (mês)" used={usage?.diets_generated ?? 0} max={currentPlan.max_diets_per_month} pct={usagePct(usage?.diets_generated ?? 0, currentPlan.max_diets_per_month)} />
              <UsageRow label="PDFs gerados (mês)" used={usage?.pdfs_generated ?? 0} max={currentPlan.max_pdfs_per_month} pct={usagePct(usage?.pdfs_generated ?? 0, currentPlan.max_pdfs_per_month)} />
              <div className="grid grid-cols-2 gap-4 text-sm pt-2">
                <div><span className="text-muted-foreground">E-mails enviados:</span> {usage?.emails_sent ?? 0}</div>
                <div><span className="text-muted-foreground">Mensagens IA:</span> {usage?.chat_messages ?? 0}</div>
              </div>
              {!sub?.cancel_at_period_end && (
                <Button variant="outline" size="sm" onClick={cancel}>Cancelar ao fim do período</Button>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle>Mudar de plano</CardTitle></CardHeader>
          <CardContent className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {plans.map((p) => (
              <div key={p.id} className={`border rounded-lg p-4 ${p.id === sub?.plan_id ? "border-primary bg-primary/5" : ""}`}>
                <div className="font-semibold">{p.name}</div>
                <div className="text-lg font-bold mt-1">{fmt(p.price_cents, p.currency)}</div>
                <div className="text-xs text-muted-foreground mt-2">
                  {p.max_clients === 0 ? "Clientes ilimitados" : `${p.max_clients} clientes`}
                </div>
                <Button
                  size="sm" className="w-full mt-3"
                  variant={p.id === sub?.plan_id ? "secondary" : "default"}
                  disabled={p.id === sub?.plan_id}
                  onClick={() => changePlan(p.id)}
                >
                  {p.id === sub?.plan_id ? "Plano atual" : "Selecionar"}
                </Button>
              </div>
            ))}
            <div className="md:col-span-2 lg:col-span-4 text-xs text-muted-foreground">
              <Link to="/planos" className="underline">Ver detalhes completos dos planos</Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Histórico de assinaturas</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {history.map((h) => {
                const pl = plans.find((p) => p.id === h.plan_id);
                return (
                  <div key={h.id} className="flex justify-between border-b py-2">
                    <span>{pl?.name ?? "—"}</span>
                    <span className="text-muted-foreground">
                      {new Date(h.current_period_start).toLocaleDateString("pt-BR")} • {h.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function UsageRow({ label, used, max, pct }: { label: string; used: number; max: number; pct: number }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span className="text-muted-foreground">{used} / {max === 0 ? "∞" : max}</span>
      </div>
      <Progress value={pct} className={pct >= 90 ? "[&>div]:bg-destructive" : ""} />
    </div>
  );
}
