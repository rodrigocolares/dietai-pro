import { useEffect, useRef, useState } from "react";
import AppShell from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Send } from "lucide-react";

type Msg = { id?: string; role: string; content: string };

export default function Chat() {
  const { user } = useAuth();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("chat_messages").select("*").eq("client_id", user.id).order("created_at", { ascending: true })
      .then(({ data }) => setMsgs((data ?? []) as Msg[]));
  }, [user]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput("");
    setMsgs((m) => [...m, { role: "user", content: text }]);
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("ai-chat", { body: { message: text } });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    if (data?.error) { toast.error(data.error); return; }
    setMsgs((m) => [...m, { role: "assistant", content: data.reply ?? "" }]);
  };

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-12rem)]">
        <h1 className="text-2xl font-bold mb-3">Chat com IA</h1>
        <Card className="flex-1 overflow-y-auto p-4 space-y-3">
          {msgs.length === 0 && <p className="text-sm text-muted-foreground">Olá! Tire suas dúvidas sobre alimentação, receitas e sua dieta.</p>}
          {msgs.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && <div className="text-xs text-muted-foreground">IA digitando...</div>}
          <div ref={endRef} />
        </Card>
        <div className="flex gap-2 mt-3">
          <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Pergunte algo..." disabled={loading} />
          <Button onClick={send} disabled={loading || !input.trim()}><Send className="w-4 h-4" /></Button>
        </div>
      </div>
    </AppShell>
  );
}
