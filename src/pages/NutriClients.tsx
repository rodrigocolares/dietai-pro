import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function NutriClients() {
  const [clients, setClients] = useState<any[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    supabase.from("profiles").select("id, full_name, phone, created_at").order("created_at", { ascending: false })
      .then(({ data }) => setClients(data ?? []));
  }, []);

  const filtered = clients.filter((c) => (c.full_name ?? "").toLowerCase().includes(q.toLowerCase()));

  return (
    <AppShell>
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Clientes</h1>
        <Input placeholder="Buscar por nome..." value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-left"><th className="p-3">Nome</th><th className="p-3">Telefone</th><th className="p-3">Desde</th></tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-t"><td className="p-3">{c.full_name || "—"}</td><td className="p-3 text-muted-foreground">{c.phone || "—"}</td><td className="p-3 text-muted-foreground">{new Date(c.created_at).toLocaleDateString("pt-BR")}</td></tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
