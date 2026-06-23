// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function escapeHtml(s: any): string {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

function buildHtml(opts: { client: string; nutri: string; diet: any; answers: any; generatedAt: string }): string {
  const { client, nutri, diet, answers, generatedAt } = opts;
  const c = diet.ai_content ?? {};
  const meals = Array.isArray(c.meals) ? c.meals : [];
  const shopping = Array.isArray(diet.shopping_list) ? diet.shopping_list : [];
  const a = answers ?? {};

  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"/>
<title>${escapeHtml(diet.title)} — DietAI Pro</title>
<style>
  :root { --primary:#16a34a; --primary-dark:#15803d; --muted:#64748b; --border:#e2e8f0; --bg:#f8fafc; }
  *{box-sizing:border-box} body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0f172a;margin:0;background:#fff;line-height:1.5}
  .page{max-width:820px;margin:0 auto;padding:32px}
  header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid var(--primary);padding-bottom:16px;margin-bottom:24px}
  .logo{font-size:22px;font-weight:800;color:var(--primary);letter-spacing:-.5px}
  .logo span{color:#0f172a}
  .approved{display:inline-block;background:var(--primary);color:#fff;padding:4px 10px;border-radius:999px;font-size:12px;font-weight:600}
  h1{font-size:26px;margin:0 0 4px}
  h2{font-size:16px;color:var(--primary-dark);margin:24px 0 8px;padding-bottom:4px;border-bottom:1px solid var(--border);text-transform:uppercase;letter-spacing:.5px}
  h3{font-size:14px;margin:12px 0 6px;color:var(--primary-dark)}
  .meta{color:var(--muted);font-size:13px}
  .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:12px 0}
  .stat{background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:12px;text-align:center}
  .stat .v{font-size:20px;font-weight:700;color:var(--primary)}
  .stat .l{font-size:11px;color:var(--muted);text-transform:uppercase}
  .info{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;background:var(--bg);border:1px solid var(--border);padding:14px;border-radius:8px;font-size:13px}
  .info b{color:#0f172a}
  .meal{border:1px solid var(--border);border-radius:8px;padding:14px;margin-bottom:10px;page-break-inside:avoid}
  .meal-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
  .meal-name{font-weight:700;color:var(--primary-dark)}
  .meal-time{color:var(--muted);font-size:12px}
  table{width:100%;border-collapse:collapse;font-size:13px}
  td{padding:5px 0;border-bottom:1px dashed var(--border)}
  td.qty{color:var(--muted);width:140px}
  td.kcal{text-align:right;color:var(--muted);width:80px}
  .subs{margin-top:8px;font-size:12px;color:var(--muted);background:#f0fdf4;border-left:3px solid var(--primary);padding:6px 10px;border-radius:4px}
  .shop-cat{margin-bottom:8px;page-break-inside:avoid}
  .shop-cat b{color:var(--primary-dark)}
  .shop-cat ul{margin:4px 0 0 18px;padding:0;font-size:13px;color:#334155}
  .guidance{background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:14px;font-size:13px;white-space:pre-wrap}
  .footer{margin-top:32px;padding-top:16px;border-top:1px solid var(--border);font-size:11px;color:var(--muted);text-align:center}
  .footer .nutri{color:#0f172a;font-weight:600;margin-bottom:4px}
  .noprint{position:fixed;top:12px;right:12px}
  .noprint button{background:var(--primary);color:#fff;border:0;padding:10px 16px;border-radius:6px;font-weight:600;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.15)}
  @media print { .noprint{display:none} .page{padding:0} body{font-size:12px} }
</style></head><body>
<div class="noprint"><button onclick="window.print()">🖨️ Imprimir / Salvar PDF</button></div>
<div class="page">
  <header>
    <div>
      <div class="logo">Diet<span>AI</span> Pro</div>
      <div class="meta">Plano nutricional personalizado</div>
    </div>
    <div style="text-align:right">
      <span class="approved">✓ Aprovada pelo nutricionista</span>
      <div class="meta" style="margin-top:6px">Gerado em ${escapeHtml(generatedAt)}</div>
    </div>
  </header>

  <h1>${escapeHtml(diet.title)}</h1>
  <div class="meta">Cliente: <b style="color:#0f172a">${escapeHtml(client)}</b></div>
  ${c.summary ? `<p style="margin-top:10px">${escapeHtml(c.summary)}</p>` : ""}

  <h2>Dados do cliente</h2>
  <div class="info">
    <div><b>Idade:</b> ${escapeHtml(a.age ?? a.idade ?? "—")}</div>
    <div><b>Peso:</b> ${escapeHtml(a.weight ?? a.peso ?? "—")} kg</div>
    <div><b>Altura:</b> ${escapeHtml(a.height ?? a.altura ?? "—")} cm</div>
    <div><b>Sexo:</b> ${escapeHtml(a.sex ?? a.sexo ?? "—")}</div>
    <div><b>Objetivo:</b> ${escapeHtml(a.goal ?? a.objetivo ?? "—")}</div>
    <div><b>Nível de atividade:</b> ${escapeHtml(a.activity_level ?? a.atividade ?? "—")}</div>
  </div>

  ${c.calories_target ? `
  <h2>Meta diária</h2>
  <div class="grid">
    <div class="stat"><div class="v">${escapeHtml(c.calories_target)}</div><div class="l">kcal</div></div>
    <div class="stat"><div class="v">${escapeHtml(c.macros?.protein_g ?? "—")}g</div><div class="l">proteína</div></div>
    <div class="stat"><div class="v">${escapeHtml(c.macros?.carbs_g ?? "—")}g</div><div class="l">carboidrato</div></div>
    <div class="stat"><div class="v">${escapeHtml(c.macros?.fat_g ?? "—")}g</div><div class="l">gordura</div></div>
  </div>` : ""}

  ${(() => {
    const dt = c.daily_totals ?? null;
    if (!dt && !c.macros) return "";
    const p = Number(dt?.protein_g ?? c.macros?.protein_g ?? 0);
    const cb = Number(dt?.carbs_g ?? c.macros?.carbs_g ?? 0);
    const g = Number(dt?.fat_g ?? c.macros?.fat_g ?? 0);
    const kcal = Number(dt?.kcal ?? c.calories_target ?? (p*4 + cb*4 + g*9));
    const kcalP = p*4, kcalC = cb*4, kcalG = g*9;
    const tot = kcalP + kcalC + kcalG || 1;
    const pctP = Math.round(kcalP/tot*100), pctC = Math.round(kcalC/tot*100), pctG = 100 - pctP - pctC;
    return `<h2>Resumo nutricional diário</h2>
      <div class="grid">
        <div class="stat"><div class="v">${Math.round(kcal)}</div><div class="l">kcal totais</div></div>
        <div class="stat"><div class="v">${p.toFixed(0)}g</div><div class="l">proteína (${pctP}%)</div></div>
        <div class="stat"><div class="v">${cb.toFixed(0)}g</div><div class="l">carboidrato (${pctC}%)</div></div>
        <div class="stat"><div class="v">${g.toFixed(0)}g</div><div class="l">gordura (${pctG}%)</div></div>
      </div>
      <div style="display:flex;height:14px;border-radius:7px;overflow:hidden;margin:8px 0 4px;background:#e5e7eb">
        <div style="width:${pctP}%;background:#16a34a"></div>
        <div style="width:${pctC}%;background:#f59e0b"></div>
        <div style="width:${pctG}%;background:#3b82f6"></div>
      </div>
      <div style="font-size:11px;color:#64748b">Distribuição de macros (por kcal): proteína • carboidrato • gordura</div>`;
  })()}

  ${meals.length ? `<h2>Plano alimentar</h2>${meals.map((m: any) => {
    const totals = m.totals ?? null;
    return `
    <div class="meal">
      <div class="meal-head">
        <div class="meal-name">${escapeHtml(m.name)}</div>
        ${m.time ? `<div class="meal-time">${escapeHtml(m.time)}</div>` : ""}
      </div>
      <table>${(m.items ?? []).map((it: any) => `
        <tr><td>${escapeHtml(it.food)}</td><td class="qty">${escapeHtml(it.qty ?? "")}</td><td class="kcal">${it.kcal ? escapeHtml(it.kcal) + " kcal" : ""}</td></tr>
      `).join("")}</table>
      ${totals ? `<div style="margin-top:6px;font-size:12px;color:#475569"><b>Totais:</b> ${Math.round(totals.kcal ?? 0)} kcal · P ${Number(totals.protein_g ?? 0).toFixed(0)}g · C ${Number(totals.carbs_g ?? 0).toFixed(0)}g · G ${Number(totals.fat_g ?? 0).toFixed(0)}g</div>` : ""}
      ${Array.isArray(m.substitutions) && m.substitutions.length ? `<div class="subs"><b>Substituições:</b> ${m.substitutions.map((s: any) => escapeHtml(typeof s === "string" ? s : `${s.food} → ${s.replace_with}`)).join(" • ")}</div>` : ""}
    </div>
  `;}).join("")}` : ""}

  ${shopping.length ? `<h2>Lista de compras</h2>${shopping.map((cat: any) => `
    <div class="shop-cat"><b>${escapeHtml(cat.category)}</b><ul>${(cat.items ?? []).map((it: any) => `<li>${escapeHtml(it)}</li>`).join("")}</ul></div>
  `).join("")}` : ""}

  ${diet.guidance ? `<h2>Orientações gerais</h2><div class="guidance">${escapeHtml(diet.guidance)}</div>` : ""}

  <div class="footer">
    <div class="nutri">Nutricionista responsável: ${escapeHtml(nutri)}</div>
    <div>Este plano foi revisado e aprovado pelo profissional responsável.</div>
    <div>DietAI Pro · Documento gerado em ${escapeHtml(generatedAt)}</div>
  </div>
</div>
</body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = await req.json().catch(() => ({}));
    const dietId = body.diet_id;
    if (!dietId || typeof dietId !== "string") {
      return new Response(JSON.stringify({ error: "diet_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: diet, error: dietErr } = await admin.from("diets").select("*").eq("id", dietId).maybeSingle();
    if (dietErr || !diet) return new Response(JSON.stringify({ error: "Diet not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (diet.status !== "approved") return new Response(JSON.stringify({ error: "Dieta ainda não foi aprovada" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Authorization: client owner OR nutricionista/admin
    const { data: roleRows } = await admin.from("user_roles").select("role").eq("user_id", user.id);
    const roles = (roleRows ?? []).map((r: any) => r.role);
    const isStaff = roles.includes("nutricionista") || roles.includes("admin");
    if (!isStaff && diet.client_id !== user.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const [{ data: clientProfile }, { data: nutriProfile }, { data: questionnaire }] = await Promise.all([
      admin.from("profiles").select("full_name").eq("id", diet.client_id).maybeSingle(),
      diet.nutritionist_id
        ? admin.from("profiles").select("full_name").eq("id", diet.nutritionist_id).maybeSingle()
        : Promise.resolve({ data: null }),
      diet.questionnaire_id
        ? admin.from("questionnaires").select("answers").eq("id", diet.questionnaire_id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    const generatedAt = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
    const html = buildHtml({
      client: clientProfile?.full_name || "Cliente",
      nutri: nutriProfile?.full_name || "Nutricionista DietAI Pro",
      diet,
      answers: (questionnaire as any)?.answers,
      generatedAt,
    });

    const path = `${diet.client_id}/${diet.id}-${Date.now()}.html`;
    const { error: upErr } = await admin.storage.from("diet-pdfs").upload(path, new Blob([html], { type: "text/html; charset=utf-8" }), {
      contentType: "text/html; charset=utf-8",
      upsert: true,
    });
    if (upErr) throw upErr;

    await admin.from("diets").update({ pdf_url: path }).eq("id", diet.id);
    await admin.from("pdf_logs").insert({ diet_id: diet.id, generated_by: user.id, client_id: diet.client_id, file_path: path });

    const { data: signed, error: signErr } = await admin.storage.from("diet-pdfs").createSignedUrl(path, 60 * 60);
    if (signErr) throw signErr;

    return new Response(JSON.stringify({ url: signed.signedUrl, path }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("generate-diet-pdf error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
