// Edge function: generates AI diet plan + shopping list + guidance from questionnaire
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { client_id, questionnaire_id } = await req.json();
    const targetClient = client_id || user.id;

    const { data: q } = await supabase
      .from("questionnaires")
      .select("*")
      .eq("id", questionnaire_id)
      .maybeSingle();

    if (!q) throw new Error("Questionário não encontrado");

    const systemPrompt = `Você é um(a) nutricionista clínico(a) experiente. Gere um plano alimentar personalizado em JSON estrito com este formato:
{
  "title": "string",
  "summary": "string com resumo do objetivo",
  "calories_target": number,
  "macros": { "protein_g": number, "carbs_g": number, "fat_g": number },
  "meals": [
    { "name": "Café da manhã", "time": "07:00", "items": [{ "food": "string", "qty": "string", "kcal": number }] }
  ],
  "shopping_list": [{ "category": "string", "items": ["string"] }],
  "guidance": "string com orientações gerais, hidratação, suplementação e contraindicações"
}
IMPORTANTE: este plano é uma SUGESTÃO inicial que será revisada por um nutricionista humano antes de ser entregue ao paciente. Não retorne nada fora do JSON.`;

    const userPrompt = `Dados do paciente (respostas do questionário):\n${JSON.stringify(q.answers, null, 2)}`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (aiRes.status === 429) return new Response(JSON.stringify({ error: "Limite de requisições atingido. Tente em instantes." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (aiRes.status === 402) return new Response(JSON.stringify({ error: "Créditos da IA esgotados. Adicione créditos no workspace." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!aiRes.ok) throw new Error(`AI error: ${await aiRes.text()}`);

    const aiJson = await aiRes.json();
    const content = aiJson.choices?.[0]?.message?.content ?? "{}";
    const plan = JSON.parse(content);

    const { data: diet, error: dietErr } = await supabase
      .from("diets")
      .insert({
        client_id: targetClient,
        questionnaire_id: q.id,
        title: plan.title ?? "Plano Alimentar",
        ai_content: plan,
        shopping_list: plan.shopping_list ?? [],
        guidance: plan.guidance ?? "",
        status: "awaiting_review",
      })
      .select()
      .single();

    if (dietErr) throw dietErr;

    return new Response(JSON.stringify({ diet }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-diet error:", e);
    return new Response(JSON.stringify({ error: String((e as Error).message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
