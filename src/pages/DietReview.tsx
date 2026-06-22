import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import AppShell from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { downloadDietPdf } from "@/lib/dietPdf";

export default function DietReview() {
  const { id } = useParams();
  const nav = useNavigate();
  const [diet, setDiet] = useState<any>(null);
  const [jsonText, setJsonText] = useState("");
  const [guidance, setGuidance] = useState("");

  useEffect(() => {
    if (!id) return;
    supabase.from("diets").select("*").eq("id", id).maybeSingle().then(({ data }) => {
      setDiet(data);
      setJsonText(JSON.stringify(data?.ai_content ?? {}, null, 2));
      setGuidance(data?.guidance ?? "");
    });
  }, [id]);

  const save = async (approve: boolean) => {
    try {
      const parsed = JSON.parse(jsonText);
      const { error } = await supabase.from("diets").update({
        ai_content: parsed,
        shopping_list: parsed.shopping_list ?? [],
        guidance,
        status: approve ? "approved" : "awaiting_review",
        approved_at: approve ? new Date().toISOString() : null,
      }).eq("id", id!);
      if (error) throw error;
      toast.success(approve ? "Dieta aprovada e enviada ao cliente!" : "Alterações salvas.");
      if (approve) nav("/nutri");
    } catch (e: any) {
      toast.error("JSON inválido ou erro: " + e.message);
    }
  };

  if (!diet) return <AppShell><p>Carregando...</p></AppShell>;

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Revisar dieta</h1>
            <p className="text-muted-foreground text-sm">Edite o plano antes de liberar para o cliente.</p>
          </div>
          <Button asChild variant="outline"><Link to="/nutri">Voltar</Link></Button>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Conteúdo da dieta (JSON)</CardTitle><CardDescription>Ajuste refeições, macros e lista de compras conforme necessário.</CardDescription></CardHeader>
          <CardContent>
            <Textarea value={jsonText} onChange={(e) => setJsonText(e.target.value)} rows={20} className="font-mono text-xs" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Orientações finais</CardTitle></CardHeader>
          <CardContent>
            <Label className="sr-only">Orientações</Label>
            <Textarea value={guidance} onChange={(e) => setGuidance(e.target.value)} rows={5} />
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button onClick={() => save(false)} variant="outline">Salvar rascunho</Button>
          <Button onClick={() => save(true)}>Aprovar e liberar para cliente</Button>
        </div>
      </div>
    </AppShell>
  );
}
