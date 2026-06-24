import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AppShell from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, FileText, FileDown, AlertTriangle } from "lucide-react";

type OrgRow = {
  id: string; name: string; status: string; created_at: string;
  subscriptions: { status: string; plan_id: string; current_period_end: string }[] | null;
};

export default function AdminSaaS() {
  const [orgs, setOrgs] = useState<OrgRow[]>([]);
  const [plans, setPlans] = useState<{ id: string; name: string; max_clients: number; max_diets_per_month: number }[]>([]);
  const [totals, setTotals] = useState({ orgs: 0, clients: 0, diets: 0, pdfs: 0 });
  const [usageByOrg, setUsageByOrg] = useState<Record<string, { diets: number; pdfs: number; clients: number }>>({});

  useEffect(() => {
    (async () => {
      const [{ data: o }, { data: pl }, { count: dietsC }, { count: pdfsC }, { count: cliC }, { data: usage }, { data: counts }] = await Promise.all([
        supabase.from("organizations").select("*, subscriptions(status, plan_id, current_period_end)").order("created_at", { ascending: false }),
        supabase.from("subscription_plans").select("id, name, max_clients, max_diets_per_month"),
        supabase.from("diets").select("id", { count: "exact", head: true }),
        supabase.from("pdf_logs").select("id", { count: "exact", head: true }),
        supabase.from("user_roles").select("user_id", { count: "exact", head: true }).eq("role", "cliente"),
        supabase.from("usage_counters").select("organization_id, diets_generated, pdfs_generated")
          .eq("period_year", new Date().getFullYear()).eq("period_month", new Date().getMonth() + 1),
        supabase.from("profiles").select("organization_id"),
      ]);
      setOrgs((o as any) ?? []);
      setPlans((pl as any) ?? []);
      setTotals({ orgs: (o ?? []).length, clients: cliC ?? 0, diets: dietsC ?? 0, pdfs: pdfsC ?? 0 });

      const byOrg: Record<string, { diets: number; pdfs: number; clients: number }> = {};
      (usage ?? []).forEach((u: any) => {
        byOrg[u.organization_id] = { diets: u.diets_generated, pdfs: u.pdfs_generated, clients: 0 };
      });
      (counts ?? []).forEach((c: any) => {
        if (!c.organization_id) return;
        byOrg[c.organization_id] ??= { diets: 0, pdfs: 0, clients: 0 };
        byOrg[c.organization_id].clients += 1;
      });
      setUsageByOrg(byOrg);
    })();
  }, []);

  const planUsage = plans.map((p) => ({
    name: p.name,
    count: orgs.filter((o) => o.subscriptions?.[0]?.plan_id === p.id).length,
  }));

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">SaaS Admin</h1>
          <p className="text-muted-foreground">Visão global da plataforma DietAI Pro.</p>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          <Stat icon={Building2} label="Organizações" value={totals.orgs} />
          <Stat icon={Users} label="Clientes" value={totals.clients} />
          <Stat icon={FileText} label="Dietas geradas" value={totals.diets} />
          <Stat icon={FileDown} label="PDFs gerados" value={totals.pdfs} />
        </div>

        <Card>
          <CardHeader><CardTitle>Uso por plano</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            {planUsage.map((p) => (
              <div key={p.name} className="border rounded-lg px-4 py-3">
                <div className="text-sm text-muted-foreground">{p.name}</div>
                <div className="text-2xl font-bold">{p.count}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Organizações</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground border-b">
                  <tr>
                    <th className="py-2">Nome</th>
                    <th>Plano</th>
                    <th>Status</th>
                    <th>Clientes</th>
                    <th>Dietas/mês</th>
                    <th>PDFs/mês</th>
                    <th>Alerta</th>
                  </tr>
                </thead>
                <tbody>
                  {orgs.map((o) => {
                    const sub = o.subscriptions?.[0];
                    const plan = plans.find((p) => p.id === sub?.plan_id);
                    const u = usageByOrg[o.id] ?? { diets: 0, pdfs: 0, clients: 0 };
                    const near =
                      (plan && plan.max_clients > 0 && u.clients / plan.max_clients >= 0.9) ||
                      (plan && plan.max_diets_per_month > 0 && u.diets / plan.max_diets_per_month >= 0.9);
                    const blocked = o.status !== "active" || sub?.status === "past_due" || sub?.status === "suspended";
                    return (
                      <tr key={o.id} className="border-b">
                        <td className="py-2">{o.name}</td>
                        <td>{plan?.name ?? "—"}</td>
                        <td>
                          <Badge variant={o.status === "active" ? "default" : "destructive"}>{o.status}</Badge>
                        </td>
                        <td>{u.clients}{plan?.max_clients ? `/${plan.max_clients}` : ""}</td>
                        <td>{u.diets}{plan?.max_diets_per_month ? `/${plan.max_diets_per_month}` : ""}</td>
                        <td>{u.pdfs}</td>
                        <td>
                          {blocked && <Badge variant="destructive">Bloqueado</Badge>}
                          {!blocked && near && <Badge variant="secondary"><AlertTriangle className="w-3 h-3 mr-1" />Limite</Badge>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg gradient-hero flex items-center justify-center">
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-2xl font-bold">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}
