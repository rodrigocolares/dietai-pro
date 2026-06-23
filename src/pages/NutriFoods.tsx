import { useEffect, useMemo, useRef, useState } from "react";
import AppShell from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Upload, Search, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type Food = {
  id: string; codigo_taco: string | null; nome: string; categoria: string; porcao_referencia: string;
  calorias: number; proteinas: number; carboidratos: number; gorduras: number; fibras: number | null; sodio: number | null;
  observacoes: string | null; ativo: boolean;
};

const EMPTY: Partial<Food> = { codigo_taco: "", nome: "", categoria: "", porcao_referencia: "100g", calorias: 0, proteinas: 0, carboidratos: 0, gorduras: 0, fibras: 0, sodio: 0, ativo: true };

export default function NutriFoods() {
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("");
  const [editing, setEditing] = useState<Partial<Food> | null>(null);
  const [open, setOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("foods").select("*").order("nome").limit(2000);
    setFoods((data ?? []) as Food[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const categories = useMemo(() => Array.from(new Set(foods.map(f => f.categoria))).sort(), [foods]);
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return foods.filter(f => (!cat || f.categoria === cat) && (!s || f.nome.toLowerCase().includes(s) || (f.codigo_taco ?? "").toLowerCase().includes(s)));
  }, [foods, q, cat]);

  const save = async () => {
    if (!editing?.nome || !editing.categoria) return toast.error("Nome e categoria são obrigatórios.");
    const payload: any = { ...editing };
    if (payload.id) {
      const { error } = await supabase.from("foods").update(payload).eq("id", payload.id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("foods").insert(payload);
      if (error) return toast.error(error.message);
    }
    toast.success("Alimento salvo.");
    setOpen(false); setEditing(null); load();
  };

  const remove = async (id: string) => {
    if (!confirm("Remover alimento?")) return;
    const { error } = await supabase.from("foods").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  const importCsv = async (file: File) => {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) return toast.error("CSV vazio.");
    const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
    const required = ["nome", "categoria", "calorias", "proteinas", "carboidratos", "gorduras"];
    for (const r of required) if (!headers.includes(r)) return toast.error("Falta coluna: " + r);
    const rows = lines.slice(1).map(l => {
      const cols = l.split(",");
      const obj: any = {};
      headers.forEach((h, i) => { obj[h] = cols[i]?.trim(); });
      ["calorias","proteinas","carboidratos","gorduras","fibras","sodio"].forEach(k => { if (obj[k] !== undefined) obj[k] = Number(obj[k]) || 0; });
      obj.porcao_referencia = obj.porcao_referencia || "100g";
      obj.ativo = true;
      return obj;
    });
    const { error } = await supabase.from("foods").upsert(rows, { onConflict: "codigo_taco" });
    if (error) return toast.error(error.message);
    toast.success(`${rows.length} alimentos importados.`);
    load();
  };

  return (
    <AppShell>
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-2xl font-bold">Base Nutricional TACO</h1>
            <p className="text-muted-foreground text-sm">Alimentos usados pela IA na geração das dietas.</p>
          </div>
          <div className="flex gap-2">
            <input ref={fileRef} type="file" accept=".csv" hidden onChange={(e) => e.target.files?.[0] && importCsv(e.target.files[0])} />
            <Button variant="outline" onClick={() => fileRef.current?.click()}><Upload className="w-4 h-4 mr-1" />Importar CSV</Button>
            <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
              <DialogTrigger asChild><Button onClick={() => setEditing({ ...EMPTY })}><Plus className="w-4 h-4 mr-1" />Novo alimento</Button></DialogTrigger>
              <DialogContent className="max-w-xl">
                <DialogHeader><DialogTitle>{editing?.id ? "Editar" : "Novo"} alimento</DialogTitle></DialogHeader>
                {editing && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2"><Label>Nome</Label><Input value={editing.nome ?? ""} onChange={(e) => setEditing({ ...editing, nome: e.target.value })} /></div>
                    <div><Label>Categoria</Label><Input value={editing.categoria ?? ""} onChange={(e) => setEditing({ ...editing, categoria: e.target.value })} /></div>
                    <div><Label>Código TACO</Label><Input value={editing.codigo_taco ?? ""} onChange={(e) => setEditing({ ...editing, codigo_taco: e.target.value })} /></div>
                    <div><Label>Porção</Label><Input value={editing.porcao_referencia ?? ""} onChange={(e) => setEditing({ ...editing, porcao_referencia: e.target.value })} /></div>
                    <div><Label>Calorias (kcal)</Label><Input type="number" value={editing.calorias ?? 0} onChange={(e) => setEditing({ ...editing, calorias: +e.target.value })} /></div>
                    <div><Label>Proteínas (g)</Label><Input type="number" value={editing.proteinas ?? 0} onChange={(e) => setEditing({ ...editing, proteinas: +e.target.value })} /></div>
                    <div><Label>Carboidratos (g)</Label><Input type="number" value={editing.carboidratos ?? 0} onChange={(e) => setEditing({ ...editing, carboidratos: +e.target.value })} /></div>
                    <div><Label>Gorduras (g)</Label><Input type="number" value={editing.gorduras ?? 0} onChange={(e) => setEditing({ ...editing, gorduras: +e.target.value })} /></div>
                    <div><Label>Fibras (g)</Label><Input type="number" value={editing.fibras ?? 0} onChange={(e) => setEditing({ ...editing, fibras: +e.target.value })} /></div>
                    <div><Label>Sódio (mg)</Label><Input type="number" value={editing.sodio ?? 0} onChange={(e) => setEditing({ ...editing, sodio: +e.target.value })} /></div>
                    <div className="col-span-2 flex justify-end"><Button onClick={save}>Salvar</Button></div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex gap-2 flex-wrap items-end">
              <div className="flex-1 min-w-[200px]">
                <Label>Buscar</Label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-2 top-3 text-muted-foreground" />
                  <Input className="pl-8" placeholder="Nome ou código TACO..." value={q} onChange={(e) => setQ(e.target.value)} />
                </div>
              </div>
              <div className="min-w-[180px]">
                <Label>Categoria</Label>
                <select className="w-full h-10 rounded-md border bg-background px-3 text-sm" value={cat} onChange={(e) => setCat(e.target.value)}>
                  <option value="">Todas</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <CardDescription className="pt-2">{filtered.length} de {foods.length} alimentos</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? <p className="text-sm text-muted-foreground">Carregando...</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-muted-foreground border-b">
                    <tr><th className="py-2">Nome</th><th>Categoria</th><th>Porção</th><th className="text-right">kcal</th><th className="text-right">P</th><th className="text-right">C</th><th className="text-right">G</th><th></th></tr>
                  </thead>
                  <tbody>
                    {filtered.slice(0, 500).map(f => (
                      <tr key={f.id} className="border-b hover:bg-muted/40">
                        <td className="py-2"><button className="text-left hover:underline" onClick={() => { setEditing(f); setOpen(true); }}>{f.nome}</button>{f.codigo_taco && <Badge variant="outline" className="ml-2 text-[10px]">{f.codigo_taco}</Badge>}</td>
                        <td>{f.categoria}</td>
                        <td>{f.porcao_referencia}</td>
                        <td className="text-right">{Number(f.calorias).toFixed(0)}</td>
                        <td className="text-right">{Number(f.proteinas).toFixed(1)}</td>
                        <td className="text-right">{Number(f.carboidratos).toFixed(1)}</td>
                        <td className="text-right">{Number(f.gorduras).toFixed(1)}</td>
                        <td className="text-right"><Button size="icon" variant="ghost" onClick={() => remove(f.id)}><Trash2 className="w-4 h-4" /></Button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
