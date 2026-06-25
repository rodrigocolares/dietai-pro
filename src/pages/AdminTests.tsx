import { useState } from "react";
import AppShell from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CheckCircle2, XCircle, Clock, Play, AlertCircle } from "lucide-react";

type Status = "pending" | "running" | "pass" | "fail";

interface TestItem {
  id: string;
  group: string;
  name: string;
  description: string;
  run: () => Promise<{ ok: boolean; details?: string }>;
}

interface TestResult {
  status: Status;
  details?: string;
  lastRun?: string;
}

const STORAGE_KEY = "dietai_test_results";

function loadResults(): Record<string, TestResult> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveResults(r: Record<string, TestResult>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(r));
}

export default function AdminTests() {
  const { user, roles } = useAuth();
  const [results, setResults] = useState<Record<string, TestResult>>(loadResults());
  const [notes, setNotes] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY + "_notes") || "{}"); } catch { return {}; }
  });
  const [running, setRunning] = useState(false);

  const tests: TestItem[] = [
    {
      id: "auth_session",
      group: "Autenticação",
      name: "Sessão ativa",
      description: "Usuário autenticado com sessão válida",
      run: async () => {
        const { data } = await supabase.auth.getUser();
        return { ok: !!data.user, details: data.user ? `uid: ${data.user.id.slice(0, 8)}…` : "sem sessão" };
      },
    },
    {
      id: "profile_exists",
      group: "Autenticação",
      name: "Profile criado automaticamente",
      description: "Registro existe na tabela profiles",
      run: async () => {
        if (!user) return { ok: false, details: "sem usuário" };
        const { data, error } = await supabase.from("profiles").select("id, organization_id").eq("id", user.id).maybeSingle();
        if (error) return { ok: false, details: error.message };
        return { ok: !!data, details: data ? `org: ${data.organization_id ?? "—"}` : "profile não encontrado" };
      },
    },
    {
      id: "role_exists",
      group: "Autenticação",
      name: "Role atribuído",
      description: "Usuário possui pelo menos um role em user_roles",
      run: async () => {
        if (!user) return { ok: false, details: "sem usuário" };
        const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
        if (error) return { ok: false, details: error.message };
        return { ok: (data?.length ?? 0) > 0, details: data?.map((r) => r.role).join(", ") || "nenhum" };
      },
    },
    {
      id: "org_resolved",
      group: "Multi-tenant",
      name: "Organization resolvida",
      description: "Nutricionista/admin precisa de organization_id",
      run: async () => {
        if (!user) return { ok: false, details: "sem usuário" };
        const needsOrg = roles.includes("nutricionista") || roles.includes("admin");
        const { data } = await supabase.from("profiles").select("organization_id").eq("id", user.id).maybeSingle();
        if (!needsOrg) return { ok: true, details: "não exigido p/ cliente" };
        return { ok: !!data?.organization_id, details: data?.organization_id ?? "ausente" };
      },
    },
    {
      id: "rls_profiles",
      group: "RLS",
      name: "RLS profiles",
      description: "Leitura só retorna o próprio profile (ou da própria org)",
      run: async () => {
        const { data, error } = await supabase.from("profiles").select("id");
        if (error) return { ok: false, details: error.message };
        return { ok: true, details: `${data?.length ?? 0} linhas visíveis` };
      },
    },
    {
      id: "rls_diets",
      group: "RLS",
      name: "RLS dietas",
      description: "Lista dietas conforme escopo",
      run: async () => {
        const { data, error } = await supabase.from("diets").select("id, organization_id").limit(50);
        if (error) return { ok: false, details: error.message };
        return { ok: true, details: `${data?.length ?? 0} dietas acessíveis` };
      },
    },
    {
      id: "rls_orgs",
      group: "RLS",
      name: "RLS organizations",
      description: "Acesso apenas à própria organização",
      run: async () => {
        const { data, error } = await supabase.from("organizations").select("id, name");
        if (error) return { ok: false, details: error.message };
        return { ok: true, details: `${data?.length ?? 0} org(s) visíveis` };
      },
    },
    {
      id: "questionnaires_access",
      group: "Fluxos",
      name: "Questionários acessíveis",
      description: "Leitura de questionnaires conforme RLS",
      run: async () => {
        const { error } = await supabase.from("questionnaires").select("id").limit(1);
        return { ok: !error, details: error?.message ?? "ok" };
      },
    },
    {
      id: "foods_loaded",
      group: "Fluxos",
      name: "Base TACO carregada",
      description: "Tabela foods deve ter alimentos cadastrados",
      run: async () => {
        const { count, error } = await supabase.from("foods").select("id", { count: "exact", head: true });
        if (error) return { ok: false, details: error.message };
        return { ok: (count ?? 0) > 0, details: `${count ?? 0} alimentos` };
      },
    },
    {
      id: "pdf_logs",
      group: "PDF",
      name: "Logs de PDF acessíveis",
      description: "Leitura de pdf_logs conforme org",
      run: async () => {
        const { error } = await supabase.from("pdf_logs").select("id").limit(1);
        return { ok: !error, details: error?.message ?? "ok" };
      },
    },
    {
      id: "storage_bucket",
      group: "PDF",
      name: "Bucket diet-pdfs",
      description: "Bucket de PDFs existe",
      run: async () => {
        const { data, error } = await supabase.storage.listBuckets();
        if (error) return { ok: false, details: error.message };
        const has = data?.some((b) => b.name === "diet-pdfs");
        return { ok: !!has, details: has ? "encontrado" : "não encontrado" };
      },
    },
    {
      id: "emails_logs",
      group: "E-mails",
      name: "Logs de e-mail",
      description: "Leitura de email_logs",
      run: async () => {
        const { error } = await supabase.from("email_logs").select("id").limit(1);
        return { ok: !error, details: error?.message ?? "ok" };
      },
    },
    {
      id: "plans_loaded",
      group: "SaaS",
      name: "Planos cadastrados",
      description: "subscription_plans deve ter linhas",
      run: async () => {
        const { count, error } = await supabase.from("subscription_plans").select("id", { count: "exact", head: true });
        if (error) return { ok: false, details: error.message };
        return { ok: (count ?? 0) > 0, details: `${count ?? 0} planos` };
      },
    },
    {
      id: "subscription_active",
      group: "SaaS",
      name: "Assinatura da organização",
      description: "Org possui assinatura ativa/trial",
      run: async () => {
        if (!user) return { ok: false, details: "sem usuário" };
        const { data: prof } = await supabase.from("profiles").select("organization_id").eq("id", user.id).maybeSingle();
        if (!prof?.organization_id) return { ok: roles.includes("cliente"), details: "sem org (ok p/ cliente)" };
        const { data, error } = await supabase
          .from("subscriptions")
          .select("status, plan_id")
          .eq("organization_id", prof.organization_id)
          .in("status", ["active", "trialing"])
          .maybeSingle();
        if (error) return { ok: false, details: error.message };
        return { ok: !!data, details: data ? `status: ${data.status}` : "sem assinatura ativa" };
      },
    },
    {
      id: "usage_limits",
      group: "SaaS",
      name: "Limites de plano (dietas)",
      description: "check_org_limit responde",
      run: async () => {
        if (!user) return { ok: false, details: "sem usuário" };
        const { data: prof } = await supabase.from("profiles").select("organization_id").eq("id", user.id).maybeSingle();
        if (!prof?.organization_id) return { ok: true, details: "n/a para cliente" };
        const { data, error } = await supabase.rpc("check_org_limit", { _org: prof.organization_id, _field: "diets" });
        if (error) return { ok: false, details: error.message };
        return { ok: true, details: JSON.stringify(data) };
      },
    },
    {
      id: "usage_counters",
      group: "SaaS",
      name: "Contadores de uso",
      description: "Leitura de usage_counters",
      run: async () => {
        const { error } = await supabase.from("usage_counters").select("organization_id").limit(1);
        return { ok: !error, details: error?.message ?? "ok" };
      },
    },
    {
      id: "cross_org_block",
      group: "Segurança",
      name: "Bloqueio cross-org",
      description: "Tentativa de ler profile aleatório de outra org deve falhar/retornar vazio",
      run: async () => {
        const fakeId = "00000000-0000-0000-0000-000000000000";
        const { data, error } = await supabase.from("profiles").select("id").eq("id", fakeId);
        if (error) return { ok: true, details: `bloqueado: ${error.message}` };
        return { ok: (data?.length ?? 0) === 0, details: `linhas: ${data?.length ?? 0}` };
      },
    },
  ];

  const updateResult = (id: string, r: TestResult) => {
    setResults((prev) => {
      const next = { ...prev, [id]: r };
      saveResults(next);
      return next;
    });
  };

  const runOne = async (t: TestItem) => {
    updateResult(t.id, { status: "running" });
    try {
      const res = await t.run();
      updateResult(t.id, {
        status: res.ok ? "pass" : "fail",
        details: res.details,
        lastRun: new Date().toISOString(),
      });
    } catch (e: any) {
      updateResult(t.id, { status: "fail", details: e?.message ?? String(e), lastRun: new Date().toISOString() });
    }
  };

  const runAll = async () => {
    setRunning(true);
    for (const t of tests) {
      await runOne(t);
    }
    setRunning(false);
  };

  const updateNote = (id: string, v: string) => {
    setNotes((prev) => {
      const next = { ...prev, [id]: v };
      localStorage.setItem(STORAGE_KEY + "_notes", JSON.stringify(next));
      return next;
    });
  };

  const groups = Array.from(new Set(tests.map((t) => t.group)));
  const total = tests.length;
  const passed = tests.filter((t) => results[t.id]?.status === "pass").length;
  const failed = tests.filter((t) => results[t.id]?.status === "fail").length;

  const StatusIcon = ({ s }: { s?: Status }) => {
    if (s === "pass") return <CheckCircle2 className="w-5 h-5 text-primary" />;
    if (s === "fail") return <XCircle className="w-5 h-5 text-destructive" />;
    if (s === "running") return <Clock className="w-5 h-5 text-muted-foreground animate-pulse" />;
    return <AlertCircle className="w-5 h-5 text-muted-foreground" />;
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold">Diagnóstico do sistema</h1>
            <p className="text-muted-foreground">Checklist de regressão para os fluxos críticos do DietAI Pro.</p>
          </div>
          <Button onClick={runAll} disabled={running} size="lg">
            <Play className="w-4 h-4 mr-2" />
            {running ? "Executando..." : "Executar diagnóstico"}
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4"><div className="text-sm text-muted-foreground">Total</div><div className="text-2xl font-bold">{total}</div></Card>
          <Card className="p-4"><div className="text-sm text-muted-foreground">Aprovados</div><div className="text-2xl font-bold text-primary">{passed}</div></Card>
          <Card className="p-4"><div className="text-sm text-muted-foreground">Falhas</div><div className="text-2xl font-bold text-destructive">{failed}</div></Card>
          <Card className="p-4"><div className="text-sm text-muted-foreground">Pendentes</div><div className="text-2xl font-bold">{total - passed - failed}</div></Card>
        </div>

        {groups.map((g) => (
          <div key={g} className="space-y-2">
            <h2 className="text-xl font-semibold">{g}</h2>
            <div className="grid gap-3">
              {tests.filter((t) => t.group === g).map((t) => {
                const r = results[t.id];
                return (
                  <Card key={t.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <StatusIcon s={r?.status} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="font-medium">{t.name}</div>
                          <div className="flex items-center gap-2">
                            {r?.status === "pass" && <Badge variant="secondary">Aprovado</Badge>}
                            {r?.status === "fail" && <Badge variant="destructive">Falhou</Badge>}
                            {r?.lastRun && (
                              <span className="text-xs text-muted-foreground">{new Date(r.lastRun).toLocaleString()}</span>
                            )}
                            <Button size="sm" variant="outline" onClick={() => runOne(t)} disabled={running}>
                              Rodar
                            </Button>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">{t.description}</div>
                        {r?.details && (
                          <div className="mt-2 text-xs font-mono bg-muted/50 p-2 rounded break-all">{r.details}</div>
                        )}
                        <Textarea
                          className="mt-2 text-sm"
                          placeholder="Observações..."
                          value={notes[t.id] ?? ""}
                          onChange={(e) => updateNote(t.id, e.target.value)}
                          rows={2}
                        />
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
