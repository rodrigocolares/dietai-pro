// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const APP_NAME = "DietAI Pro";
const APP_URL = Deno.env.get("APP_URL") ?? "https://personalized-diet-hub.lovable.app";

type TemplateName = "diet_approved" | "diet_pending_review" | "weekly_checkin_reminder" | "pdf_generated";

const PRIMARY = "#16a34a";
const PRIMARY_DARK = "#15803d";

function shell(title: string, bodyHtml: string, ctaText?: string, ctaUrl?: string) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#0f172a">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 0">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.04)">
        <tr><td style="background:${PRIMARY};padding:20px 28px">
          <div style="font-size:22px;font-weight:800;color:#fff;letter-spacing:-.5px">Diet<span style="opacity:.85">AI</span> Pro</div>
        </td></tr>
        <tr><td style="padding:28px">
          <h1 style="font-size:22px;margin:0 0 14px;color:${PRIMARY_DARK}">${title}</h1>
          <div style="font-size:14px;line-height:1.6">${bodyHtml}</div>
          ${ctaText && ctaUrl ? `<div style="margin:24px 0 8px"><a href="${ctaUrl}" style="display:inline-block;background:${PRIMARY};color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600">${ctaText}</a></div>` : ""}
        </td></tr>
        <tr><td style="padding:16px 28px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:11px;color:#64748b;text-align:center">
          ${APP_NAME} · Notificação automática · Não responda este e-mail.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function esc(s: any) { return String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!)); }

function renderTemplate(name: TemplateName, data: any): { subject: string; html: string } {
  switch (name) {
    case "diet_approved":
      return {
        subject: `Sua dieta foi aprovada — ${APP_NAME}`,
        html: shell(
          "Sua dieta está pronta! 🎉",
          `<p>Olá <b>${esc(data.client_name ?? "")}</b>,</p>
           <p>Boa notícia! Sua dieta <b>${esc(data.diet_title ?? "")}</b> foi revisada e aprovada pelo nutricionista.</p>
           <p>Já está disponível na sua área para consulta e download em PDF.</p>`,
          "Acessar minha dieta",
          `${APP_URL}/area`,
        ),
      };
    case "diet_pending_review":
      return {
        subject: `Nova dieta aguardando revisão — ${APP_NAME}`,
        html: shell(
          "Nova dieta para revisar",
          `<p>Olá,</p>
           <p>O cliente <b>${esc(data.client_name ?? "")}</b> gerou uma nova dieta que está aguardando sua revisão.</p>
           <p><b>Dieta:</b> ${esc(data.diet_title ?? "")}</p>`,
          "Revisar agora",
          `${APP_URL}/nutri/revisar/${esc(data.diet_id ?? "")}`,
        ),
      };
    case "weekly_checkin_reminder":
      return {
        subject: `Hora do seu check-in semanal — ${APP_NAME}`,
        html: shell(
          "Como foi sua semana? 💪",
          `<p>Olá <b>${esc(data.client_name ?? "")}</b>,</p>
           <p>Está na hora do seu check-in semanal. Leva menos de 2 minutos e ajuda seu nutricionista a acompanhar seu progresso.</p>`,
          "Fazer check-in",
          `${APP_URL}/check-in`,
        ),
      };
    case "pdf_generated":
      return {
        subject: `PDF da sua dieta disponível — ${APP_NAME}`,
        html: shell(
          "Seu PDF está pronto 📄",
          `<p>Olá <b>${esc(data.client_name ?? "")}</b>,</p>
           <p>O PDF da dieta <b>${esc(data.diet_title ?? "")}</b> foi gerado e está disponível para download.</p>`,
          "Baixar PDF",
          `${APP_URL}/area`,
        ),
      };
  }
}

async function sendSmtp(to: string, subject: string, html: string) {
  const host = Deno.env.get("SMTP_HOST");
  const port = Number(Deno.env.get("SMTP_PORT") ?? "587");
  const user = Deno.env.get("SMTP_USER");
  const pass = Deno.env.get("SMTP_PASS");
  const fromEmail = Deno.env.get("SMTP_FROM_EMAIL") ?? user;
  const fromName = Deno.env.get("SMTP_FROM_NAME") ?? APP_NAME;
  if (!host || !user || !pass || !fromEmail) throw new Error("SMTP não configurado (faltam SMTP_HOST/USER/PASS/FROM_EMAIL).");

  const client = new SMTPClient({
    connection: {
      hostname: host,
      port,
      tls: port === 465,
      auth: { username: user, password: pass },
    },
  });
  try {
    await client.send({ from: `${fromName} <${fromEmail}>`, to, subject, html, content: "Veja este e-mail em um cliente compatível com HTML." });
  } finally {
    try { await client.close(); } catch { /* ignore */ }
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const body = await req.json().catch(() => ({}));
    const {
      template_name,
      diet_id,
      log_id, // for resends
      recipient_email: overrideEmail,
      target_user_id: overrideUserId,
    } = body as { template_name?: TemplateName; diet_id?: string; log_id?: string; recipient_email?: string; target_user_id?: string };

    // Determine caller
    let callerId: string | null = null;
    let isStaff = false;
    let isCronInternal = false;
    if (authHeader) {
      const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
      const { data: { user } } = await userClient.auth.getUser();
      if (user) {
        callerId = user.id;
        const { data: rr } = await admin.from("user_roles").select("role").eq("user_id", user.id);
        const roles = (rr ?? []).map((r: any) => r.role);
        isStaff = roles.includes("nutricionista") || roles.includes("admin");
      }
    }
    // Internal/cron call via service role (no user JWT) is allowed only with the service-role key in the secret header.
    if (!callerId && req.headers.get("x-internal-secret") === SERVICE_KEY) isCronInternal = true;

    // Resend flow
    if (log_id) {
      if (!isStaff) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const { data: log } = await admin.from("email_logs").select("*").eq("id", log_id).maybeSingle();
      if (!log) return new Response(JSON.stringify({ error: "Log not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const rendered = renderTemplate(log.template_name as TemplateName, log.payload ?? {});
      try {
        await sendSmtp(log.recipient_email, rendered.subject, rendered.html);
        await admin.from("email_logs").update({ status: "sent", sent_at: new Date().toISOString(), error_message: null }).eq("id", log_id);
        return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } catch (e) {
        await admin.from("email_logs").update({ status: "failed", error_message: (e as Error).message }).eq("id", log_id);
        throw e;
      }
    }

    if (!template_name) return new Response(JSON.stringify({ error: "template_name required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Build recipient(s) + payload based on template
    type Job = { user_id: string | null; email: string; payload: any; diet_id: string | null };
    const jobs: Job[] = [];

    async function profileEmail(userId: string): Promise<string | null> {
      const { data } = await admin.auth.admin.getUserById(userId);
      return data.user?.email ?? null;
    }
    async function profileName(userId: string): Promise<string> {
      const { data } = await admin.from("profiles").select("full_name").eq("id", userId).maybeSingle();
      return data?.full_name || "Cliente";
    }

    if (template_name === "diet_approved" || template_name === "pdf_generated") {
      if (!diet_id) return new Response(JSON.stringify({ error: "diet_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const { data: diet } = await admin.from("diets").select("*").eq("id", diet_id).maybeSingle();
      if (!diet) return new Response(JSON.stringify({ error: "Diet not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      // Auth: staff OR the diet owner client triggers their own (pdf_generated)
      if (!isStaff && !isCronInternal && callerId !== diet.client_id) {
        return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const email = overrideEmail ?? await profileEmail(diet.client_id);
      if (!email) return new Response(JSON.stringify({ error: "Recipient email not found" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      jobs.push({ user_id: diet.client_id, email, diet_id: diet.id, payload: { client_name: await profileName(diet.client_id), diet_title: diet.title } });
    } else if (template_name === "diet_pending_review") {
      if (!diet_id) return new Response(JSON.stringify({ error: "diet_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const { data: diet } = await admin.from("diets").select("*").eq("id", diet_id).maybeSingle();
      if (!diet) return new Response(JSON.stringify({ error: "Diet not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (!callerId && !isCronInternal) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      // Notify all nutricionistas + admins
      const { data: roleRows } = await admin.from("user_roles").select("user_id, role").in("role", ["nutricionista", "admin"]);
      const clientName = await profileName(diet.client_id);
      for (const r of roleRows ?? []) {
        const email = await profileEmail(r.user_id);
        if (email) jobs.push({ user_id: r.user_id, email, diet_id: diet.id, payload: { client_name: clientName, diet_title: diet.title, diet_id: diet.id } });
      }
    } else if (template_name === "weekly_checkin_reminder") {
      // Only internal cron, staff, or the client themselves
      if (!isCronInternal && !isStaff) {
        if (!callerId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (overrideUserId && overrideUserId !== callerId) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (overrideUserId) {
        const email = await profileEmail(overrideUserId);
        if (email) jobs.push({ user_id: overrideUserId, email, diet_id: null, payload: { client_name: await profileName(overrideUserId) } });
      } else {
        // Broadcast to all cliente role users
        const { data: roleRows } = await admin.from("user_roles").select("user_id").eq("role", "cliente");
        for (const r of roleRows ?? []) {
          const email = await profileEmail(r.user_id);
          if (email) jobs.push({ user_id: r.user_id, email, diet_id: null, payload: { client_name: await profileName(r.user_id) } });
        }
      }
    }

    const results: any[] = [];
    for (const job of jobs) {
      const rendered = renderTemplate(template_name, job.payload);
      const { data: logRow } = await admin.from("email_logs").insert({
        user_id: job.user_id,
        diet_id: job.diet_id,
        recipient_email: job.email,
        subject: rendered.subject,
        template_name,
        status: "pending",
        payload: job.payload,
      }).select("id").single();
      try {
        await sendSmtp(job.email, rendered.subject, rendered.html);
        await admin.from("email_logs").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", logRow!.id);
        results.push({ email: job.email, ok: true });
      } catch (e) {
        const msg = (e as Error).message;
        console.error("SMTP error for", job.email, msg);
        await admin.from("email_logs").update({ status: "failed", error_message: msg }).eq("id", logRow!.id);
        results.push({ email: job.email, ok: false, error: msg });
      }
    }

    return new Response(JSON.stringify({ sent: results.filter((r) => r.ok).length, failed: results.filter((r) => !r.ok).length, results }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("send-email-notification error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
