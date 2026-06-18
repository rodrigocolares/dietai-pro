import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const FIELDS = [
  { k: "age", l: "Idade", t: "number" },
  { k: "weight", l: "Peso (kg)", t: "number" },
  { k: "height", l: "Altura (cm)", t: "number" },
  { k: "sex", l: "Sexo (M/F/Outro)", t: "text" },
  { k: "activity", l: "Nível de atividade física", t: "text" },
  { k: "goal", l: "Objetivo (emagrecer, ganhar massa, manter, saúde)", t: "text" },
  { k: "restrictions", l: "Restrições alimentares ou alergias", t: "textarea" },
  { k: "diseases", l: "Doenças/condições de saúde", t: "textarea" },
  { k: "medications", l: "Medicamentos em uso", t: "textarea" },
  { k: "likes", l: "Alimentos que gosta", t: "textarea" },
  { k: "dislikes", l: "Alimentos que NÃO gosta", t: "textarea" },
  { k: "routine", l: "Rotina diária e horários de refeição", t: "textarea" },
];

export default function Questionnaire() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("questionnaires").select("*").eq("client_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle()
      .then(({ data }) => { if (data?.answers) setAnswers(data.answers as Record<string, string>); });
  }, [user]);

  const submit = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase.from("questionnaires").insert({ client_id: user.id, answers }).select().single();
    if (error) { setLoading(false); return toast.error(error.message); }
    toast.success("Questionário enviado! Gerando dieta com IA...");
    const { data: gen, error: gErr } = await supabase.functions.invoke("generate-diet", { body: { questionnaire_id: data.id } });
    setLoading(false);
    if (gErr) return toast.error("Erro ao gerar dieta: " + gErr.message);
    toast.success("Dieta gerada! Aguardando revisão do nutricionista.");
    nav("/area");
  };

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Questionário Nutricional</CardTitle>
            <CardDescription>Quanto mais detalhes você fornecer, melhor o plano gerado.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {FIELDS.map((f) => (
              <div key={f.k} className="space-y-2">
                <Label>{f.l}</Label>
                {f.t === "textarea" ? (
                  <Textarea value={answers[f.k] ?? ""} onChange={(e) => setAnswers({ ...answers, [f.k]: e.target.value })} rows={2} />
                ) : (
                  <Input type={f.t} value={answers[f.k] ?? ""} onChange={(e) => setAnswers({ ...answers, [f.k]: e.target.value })} />
                )}
              </div>
            ))}
            <Button onClick={submit} disabled={loading} className="w-full">
              {loading ? "Enviando e gerando dieta..." : "Enviar e gerar dieta com IA"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
