import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import AppShell from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { downloadDietPdf } from "@/lib/dietPdf";

export default function DietView() {
  const { id } = useParams();
  const [diet, setDiet] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    supabase.from("diets").select("*").eq("id", id).maybeSingle().then(({ data }) => setDiet(data));
  }, [id]);

  if (!diet) return <AppShell><p>Carregando...</p></AppShell>;
  const c = diet.ai_content ?? {};

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{diet.title}</h1>
          <Badge className={diet.status === "approved" ? "bg-primary" : ""}>{diet.status === "approved" ? "Aprovada" : "Aguardando revisão"}</Badge>
        </div>
        {c.summary && <p className="text-muted-foreground">{c.summary}</p>}

        {c.calories_target && (
          <Card>
            <CardHeader><CardTitle className="text-base">Meta diária</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-4 gap-3 text-center">
              <div><div className="text-2xl font-bold text-primary">{c.calories_target}</div><div className="text-xs text-muted-foreground">kcal</div></div>
              <div><div className="text-2xl font-bold">{c.macros?.protein_g}g</div><div className="text-xs text-muted-foreground">proteína</div></div>
              <div><div className="text-2xl font-bold">{c.macros?.carbs_g}g</div><div className="text-xs text-muted-foreground">carboidrato</div></div>
              <div><div className="text-2xl font-bold">{c.macros?.fat_g}g</div><div className="text-xs text-muted-foreground">gordura</div></div>
            </CardContent>
          </Card>
        )}

        {Array.isArray(c.meals) && c.meals.map((m: any, i: number) => (
          <Card key={i}>
            <CardHeader><CardTitle className="text-base">{m.name} {m.time && <span className="text-muted-foreground text-sm font-normal">— {m.time}</span>}</CardTitle></CardHeader>
            <CardContent>
              <ul className="text-sm space-y-1">
                {(m.items ?? []).map((it: any, j: number) => (
                  <li key={j} className="flex justify-between border-b py-1">
                    <span>{it.food} <span className="text-muted-foreground">({it.qty})</span></span>
                    {it.kcal && <span className="text-muted-foreground">{it.kcal} kcal</span>}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}

        {Array.isArray(diet.shopping_list) && diet.shopping_list.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Lista de compras</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {diet.shopping_list.map((cat: any, i: number) => (
                <div key={i}>
                  <div className="font-medium">{cat.category}</div>
                  <ul className="list-disc ml-5 text-muted-foreground">{(cat.items ?? []).map((it: string, j: number) => <li key={j}>{it}</li>)}</ul>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {diet.guidance && (
          <Card>
            <CardHeader><CardTitle className="text-base">Orientações</CardTitle></CardHeader>
            <CardContent className="text-sm whitespace-pre-wrap">{diet.guidance}</CardContent>
          </Card>
        )}

        <div className="flex gap-2">
          <Button onClick={() => window.print()}>Imprimir / Salvar PDF</Button>
          <Button asChild variant="outline"><Link to="/area">Voltar</Link></Button>
        </div>
      </div>
    </AppShell>
  );
}
