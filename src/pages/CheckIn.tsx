import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function CheckIn() {
  const { user } = useAuth();
  const [weight, setWeight] = useState("");
  const [mood, setMood] = useState("");
  const [adherence, setAdherence] = useState("");
  const [notes, setNotes] = useState("");
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = () => {
    if (!user) return;
    supabase.from("check_ins").select("*").eq("client_id", user.id).order("created_at", { ascending: false }).limit(10)
      .then(({ data }) => setHistory(data ?? []));
  };
  useEffect(load, [user]);

  const submit = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("check_ins").insert({
      client_id: user.id,
      weight: weight ? Number(weight) : null,
      mood, adherence: adherence ? Number(adherence) : null, notes,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Check-in registrado!");
    setWeight(""); setMood(""); setAdherence(""); setNotes("");
    load();
  };

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-4">
        <Card className="shadow-soft">
          <CardHeader><CardTitle>Check-in semanal</CardTitle><CardDescription>Acompanhe sua evolução</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Peso (kg)</Label><Input type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} /></div>
              <div><Label>Aderência (0-100%)</Label><Input type="number" min="0" max="100" value={adherence} onChange={(e) => setAdherence(e.target.value)} /></div>
            </div>
            <div><Label>Como se sentiu?</Label><Input value={mood} onChange={(e) => setMood(e.target.value)} placeholder="Ex: animado, cansado..." /></div>
            <div><Label>Observações</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} /></div>
            <Button onClick={submit} disabled={loading} className="w-full">{loading ? "Salvando..." : "Registrar check-in"}</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Histórico</CardTitle></CardHeader>
          <CardContent>
            {history.length === 0 && <p className="text-sm text-muted-foreground">Nenhum check-in ainda.</p>}
            <ul className="text-sm space-y-2">
              {history.map((h) => (
                <li key={h.id} className="flex justify-between border-b py-2">
                  <span>{new Date(h.created_at).toLocaleDateString("pt-BR")} — {h.weight ?? "—"} kg</span>
                  <span className="text-muted-foreground">{h.mood} · {h.adherence ?? "—"}%</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
