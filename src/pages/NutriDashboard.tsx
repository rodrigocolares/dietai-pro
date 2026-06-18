import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function NutriDashboard() {
  const [stats, setStats] = useState({ clients: 0, awaiting: 0, approved: 0 });
  const [pending, setPending] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [{ count: clients }, { count: awaiting }, { count: approved }, { data: pendingList }] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("diets").select("id", { count: "exact", head: true }).eq("status", "awaiting_review"),
        supabase.from("diets").select("id", { count: "exact", head: true }).eq("status", "approved"),
        supabase.from("diets").select("id, title, created_at, client_id").eq("status", "awaiting_review").order("created_at", { ascending: false }).limit(10),
      ]);
      setStats({ clients: clients ?? 0, awaiting: awaiting ?? 0, approved: approved ?? 0 });

      const list = pendingList ?? [];
      const ids = Array.from(new Set(list.map((d: any) => d.client_id)));
      let names: Record<string, string> = {};
      if (ids.length) {
        const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", ids);
        names = Object.fromEntries((profs ?? []).map((p: any) => [p.id, p.full_name]));
      }
      setPending(list.map((d: any) => ({ ...d, client_name: names[d.client_id] })));
    })();
  }, []);

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard do Nutricionista</h1>
          <p className="text-muted-foreground">Visão geral de clientes e dietas pendentes de revisão.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <Card><CardHeader><CardDescription>Clientes cadastrados</CardDescription><CardTitle className="text-3xl">{stats.clients}</CardTitle></CardHeader></Card>
          <Card><CardHeader><CardDescription>Aguardando revisão</CardDescription><CardTitle className="text-3xl text-accent">{stats.awaiting}</CardTitle></CardHeader></Card>
          <Card><CardHeader><CardDescription>Dietas aprovadas</CardDescription><CardTitle className="text-3xl text-primary">{stats.approved}</CardTitle></CardHeader></Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Dietas para revisar</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {pending.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma dieta pendente.</p>}
            {pending.map((d) => (
              <div key={d.id} className="flex items-center justify-between border-b py-2">
                <div>
                  <div className="font-medium">{d.title}</div>
                  <div className="text-xs text-muted-foreground">Cliente: {d.client_name || d.client_id.slice(0, 8)} · {new Date(d.created_at).toLocaleString("pt-BR")}</div>
                </div>
                <Button asChild size="sm"><Link to={`/nutri/revisar/${d.id}`}>Revisar</Link></Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
