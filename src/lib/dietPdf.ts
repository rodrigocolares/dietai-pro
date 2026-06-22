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
    toast.error("Falha ao gerar PDF: " + (e.message ?? "erro"), { id: t });
  }
}
