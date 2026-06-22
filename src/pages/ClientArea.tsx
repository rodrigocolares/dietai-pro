import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { CheckCircle2, Clock, FileText, Download } from "lucide-react";
import { downloadDietPdf } from "@/lib/dietPdf";

type Diet = {
  id: string; title: string; status: string; created_at: string; approved_at: string | null;
  ai_content: any; shopping_list: any; guidance: string | null;
};

export default function ClientArea() {
  const { user } = useAuth();
  const [diets, setDiets] = useState<Diet[]>([]);
  const [checkInsCount, setCheckIns] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase.from("diets").select("*").eq("client_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => setDiets((data ?? []) as Diet[]));
    supabase.from("check_ins").select("id", { count: "exact", head: true }).eq("client_id", user.id)
      .then(({ count }) => setCheckIns(count ?? 0));
  }, [user]);

  const approved = diets.filter((d) => d.status === "approved");
  const pending = diets.filter((d) => d.status === "awaiting_review");

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Minha área</h1>
          <p className="text-muted-foreground">Acompanhe suas dietas aprovadas, check-ins e histórico.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Card><CardHeader><CardDescription>Dietas aprovadas</CardDescription><CardTitle className="text-3xl">{approved.length}</CardTitle></CardHeader></Card>
          <Card><CardHeader><CardDescription>Aguardando revisão</CardDescription><CardTitle className="text-3xl">{pending.length}</CardTitle></CardHeader></Card>
          <Card><CardHeader><CardDescription>Check-ins enviados</CardDescription><CardTitle className="text-3xl">{checkInsCount}</CardTitle></CardHeader></Card>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button asChild><Link to="/questionario">Novo questionário</Link></Button>
          <Button asChild variant="outline"><Link to="/check-in">Fazer check-in</Link></Button>
          <Button asChild variant="outline"><Link to="/chat">Chat IA</Link></Button>
        </div>

        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Minhas dietas</h2>
          {diets.length === 0 && <p className="text-muted-foreground text-sm">Nenhuma dieta ainda. Responda o questionário para gerar a primeira.</p>}
          {diets.map((d) => (
            <Card key={d.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2"><FileText className="w-4 h-4" />{d.title}</CardTitle>
                  <CardDescription>{new Date(d.created_at).toLocaleString("pt-BR")}</CardDescription>
                </div>
                {d.status === "approved" ? (
                  <Badge className="bg-primary"><CheckCircle2 className="w-3 h-3 mr-1" />Aprovada</Badge>
                ) : (
                  <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Aguardando revisão</Badge>
                )}
              </CardHeader>
              {d.status === "approved" && (
                <CardContent>
                  <Button asChild size="sm"><Link to={`/dieta/${d.id}`}>Ver dieta completa</Link></Button>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
