import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export async function downloadDietPdf(dietId: string) {
  const t = toast.loading("Gerando PDF...");
  try {
    const { data, error } = await supabase.functions.invoke("generate-diet-pdf", { body: { diet_id: dietId } });
    if (error) throw error;
    if (!data?.url) throw new Error("URL não retornada");
    window.open(data.url as string, "_blank", "noopener");
    supabase.functions.invoke("send-email-notification", { body: { template_name: "pdf_generated", diet_id: dietId } }).catch(() => {});
    toast.success("PDF gerado! Use o botão Imprimir / Salvar PDF na página aberta.", { id: t });
  } catch (e: any) {
    const msg = e?.context?.error || e?.message || "erro desconhecido";
    if (/forbidden|denied|rls|permission/i.test(String(msg))) {
      toast.error("Você não tem permissão para gerar o PDF desta dieta.", { id: t });
    } else if (/storage/i.test(String(msg))) {
      toast.error("Falha ao acessar o armazenamento do PDF. Tente novamente em instantes.", { id: t });
    } else {
      toast.error("Falha ao gerar PDF: " + msg, { id: t });
    }
  }
}
