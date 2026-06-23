import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

type Diet = { id: string; status: string; ai_content: any; created_at: string };

export default function NutriStats() {
  const [diets, setDiets] = useState<Diet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("diets").select("id,status,ai_content,created_at").order("created_at", { ascending: false }).limit(200);
      setDiets((data ?? []) as Diet[]);
      setLoading(false);
    })();
  }, []);

  const stats = useMemo(() => {
    let totalKcal = 0, totalP = 0, totalC = 0, totalG = 0, withTotals = 0;
    const foodCount = new Map<string, number>();
    for (const d of diets) {
      const c = d.ai_content ?? {};
      const dt = c.daily_totals ?? c.macros ?? null;
      const kcal = Number(dt?.kcal ?? c.calories_target ?? 0);
      const p = Number(dt?.protein_g ?? 0), cb = Number(dt?.carbs_g ?? 0), g = Number(dt?.fat_g ?? 0);
      if (kcal || p || cb || g) { totalKcal += kcal; totalP += p; totalC += cb; totalG += g; withTotals++; }
      for (const m of (c.meals ?? [])) {
        for (const it of (m.items ?? [])) {
          const name = (it.food ?? "").trim();
          if (name) foodCount.set(name, (foodCount.get(name) ?? 0) + 1);
        }
        for (const s of (m.substitutions ?? [])) {
          const name = typeof s === "string" ? s : (s.food ?? "");
          if (name) foodCount.set("(subst.) " + name, (foodCount.get("(subst.) " + name) ?? 0) + 1);
        }
      }
    }
    const n = Math.max(1, withTotals);
    const avgKcal = totalKcal / n, avgP = totalP / n, avgC = totalC / n, avgG = totalG / n;
    const kcalP = avgP*4, kcalC = avgC*4, kcalG = avgG*9;
    const tot = kcalP + kcalC + kcalG || 1;
    const pctP = Math.round(kcalP/tot*100), pctC = Math.round(kcalC/tot*100), pctG = 100 - pctP - pctC;
    const topFoods = Array.from(foodCount.entries())
      .filter(([k]) => !k.startsWith("(subst.)"))
      .sort((a,b) => b[1]-a[1]).slice(0, 10);
    const topSubs = Array.from(foodCount.entries())
      .filter(([k]) => k.startsWith("(subst.)"))
      .map(([k,v]) => [k.replace("(subst.) ",""), v] as [string, number])
      .sort((a,b) => b[1]-a[1]).slice(0, 10);
    return { count: diets.length, avgKcal, avgP, avgC, avgG, pctP, pctC, pctG, topFoods, topSubs };
  }, [diets]);

  return (
    <AppShell>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Indicadores nutricionais</h1>
          <p className="text-muted-foreground text-sm">Médias calculadas sobre as últimas {stats.count} dietas.</p>
        </div>

        {loading ? <p className="text-sm text-muted-foreground">Carregando...</p> : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card><CardHeader className="pb-2"><CardDescription>Média calórica</CardDescription><CardTitle>{Math.round(stats.avgKcal)} kcal</CardTitle></CardHeader></Card>
              <Card><CardHeader className="pb-2"><CardDescription>Proteína média</CardDescription><CardTitle>{stats.avgP.toFixed(0)} g</CardTitle></CardHeader></Card>
              <Card><CardHeader className="pb-2"><CardDescription>Carbo médio</CardDescription><CardTitle>{stats.avgC.toFixed(0)} g</CardTitle></CardHeader></Card>
              <Card><CardHeader className="pb-2"><CardDescription>Gordura média</CardDescription><CardTitle>{stats.avgG.toFixed(0)} g</CardTitle></CardHeader></Card>
            </div>

            <Card>
              <CardHeader><CardTitle className="text-base">Distribuição média de macros</CardTitle></CardHeader>
              <CardContent>
                <div className="flex h-4 rounded overflow-hidden bg-muted">
                  <div style={{ width: stats.pctP + "%" }} className="bg-primary" />
                  <div style={{ width: stats.pctC + "%", background: "#f59e0b" }} />
                  <div style={{ width: stats.pctG + "%", background: "#3b82f6" }} />
                </div>
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>Proteína {stats.pctP}%</span><span>Carboidrato {stats.pctC}%</span><span>Gordura {stats.pctG}%</span>
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-3">
              <Card>
                <CardHeader><CardTitle className="text-base">Alimentos mais utilizados</CardTitle></CardHeader>
                <CardContent>
                  {stats.topFoods.length === 0 ? <p className="text-sm text-muted-foreground">Sem dados.</p> : (
                    <ol className="space-y-1 text-sm">
                      {stats.topFoods.map(([n,c]) => <li key={n} className="flex justify-between border-b py-1"><span>{n}</span><span className="text-muted-foreground">{c}×</span></li>)}
                    </ol>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base">Mais sugeridos como substituição</CardTitle></CardHeader>
                <CardContent>
                  {stats.topSubs.length === 0 ? <p className="text-sm text-muted-foreground">Sem dados.</p> : (
                    <ol className="space-y-1 text-sm">
                      {stats.topSubs.map(([n,c]) => <li key={n} className="flex justify-between border-b py-1"><span>{n}</span><span className="text-muted-foreground">{c}×</span></li>)}
                    </ol>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
