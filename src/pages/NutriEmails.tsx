import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { RefreshCw, Send } from "lucide-react";

type Log = {
  id: string; recipient_email: string; subject: string; template_name: string;
  status: string; error_message: string | null; sent_at: string | null; created_at: string; channel: string;
};

const TEMPLATE_LABEL: Record<string, string> = {
  diet_approved: "Dieta aprovada",
  diet_pending_review: "Dieta aguardando revisão",
  weekly_checkin_reminder: "Lembrete de check-in",
  pdf_generated: "PDF gerado",
};

export default function NutriEmails() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("email_logs").select("*").order("created_at", { ascending: false }).limit(100);
    setLogs((data ?? []) as Log[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const resend = async (id: string) => {
    setBusy(id);
    try {
      const { error } = await supabase.functions.invoke("send-email-notification", { body: { log_id: id } });
      if (error) throw error;
      toast.success("E-mail reenviado.");
      await load();
    } catch (e: any) {
      toast.error("Falha ao reenviar: " + (e.message ?? "erro"));
    } finally { setBusy(null); }
  };

  const triggerWeeklyReminder = async () => {
    setBusy("weekly");
    try {
      const { data, error } = await supabase.functions.invoke("send-email-notification", { body: { template_name: "weekly_checkin_reminder" } });
      if (error) throw error;
      toast.success(`Lembretes enviados: ${data?.sent ?? 0} (falhas: ${data?.failed ?? 0})`);
      await load();
    } catch (e: any) {
      toast.error("Falha: " + (e.message ?? "erro"));
    } finally { setBusy(null); }
  };

  const statusBadge = (s: string) => {
    if (s === "sent") return <Badge className="bg-primary">Enviado</Badge>;
    if (s === "failed") return <Badge variant="destructive">Falhou</Badge>;
    return <Badge variant="secondary">Pendente</Badge>;
  };

  return (
    <AppShell>
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-2xl font-bold">Notificações por e-mail</h1>
            <p className="text-muted-foreground text-sm">Histórico de envios automáticos do sistema.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={load} disabled={loading}><RefreshCw className="w-4 h-4 mr-1" />Atualizar</Button>
            <Button onClick={triggerWeeklyReminder} disabled={busy === "weekly"}><Send className="w-4 h-4 mr-1" />Disparar lembrete de check-in</Button>
          </div>
        </div>

        {loading ? <p className="text-muted-foreground text-sm">Carregando...</p> : logs.length === 0 ? (
          <Card><CardContent className="pt-6 text-sm text-muted-foreground">Nenhum e-mail enviado ainda.</CardContent></Card>
        ) : (
          <div className="space-y-2">
            {logs.map((l) => (
              <Card key={l.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <CardTitle className="text-base">{l.subject}</CardTitle>
                      <CardDescription>
                        {TEMPLATE_LABEL[l.template_name] ?? l.template_name} · Para <b>{l.recipient_email}</b> · {new Date(l.created_at).toLocaleString("pt-BR")}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {statusBadge(l.status)}
                      {l.status === "failed" && (
                        <Button size="sm" variant="outline" disabled={busy === l.id} onClick={() => resend(l.id)}>
                          {busy === l.id ? "Reenviando..." : "Reenviar"}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                {l.status === "failed" && l.error_message && (
                  <CardContent className="text-xs text-destructive">Erro: {l.error_message}</CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
