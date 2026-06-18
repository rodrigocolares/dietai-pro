import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function NutriDiets() {
  const [diets, setDiets] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("diets").select("id, title, status, created_at, client_id").order("created_at", { ascending: false });
      const list = data ?? [];
      const ids = Array.from(new Set(list.map((d: any) => d.client_id)));
      let names: Record<string, string> = {};
      if (ids.length) {
        const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", ids);
        names = Object.fromEntries((profs ?? []).map((p: any) => [p.id, p.full_name]));
      }
      setDiets(list.map((d: any) => ({ ...d, client_name: names[d.client_id] })));
    })();
  }, []);

  return (
    <AppShell>
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Todas as dietas</h1>
        <Card><CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/50"><tr className="text-left"><th className="p-3">Cliente</th><th className="p-3">Título</th><th className="p-3">Status</th><th className="p-3">Data</th><th className="p-3"></th></tr></thead>
            <tbody>
              {diets.map((d) => (
                <tr key={d.id} className="border-t">
                  <td className="p-3">{d.client_name || "—"}</td>
                  <td className="p-3">{d.title}</td>
                  <td className="p-3"><Badge variant={d.status === "approved" ? "default" : "secondary"}>{d.status === "approved" ? "Aprovada" : "Aguardando"}</Badge></td>
                  <td className="p-3 text-muted-foreground">{new Date(d.created_at).toLocaleDateString("pt-BR")}</td>
                  <td className="p-3"><Button asChild size="sm" variant="outline"><Link to={`/nutri/revisar/${d.id}`}>Abrir</Link></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent></Card>
      </div>
    </AppShell>
  );
}
