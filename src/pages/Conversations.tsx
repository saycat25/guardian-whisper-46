import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MessagesSquare, Search } from "lucide-react";
import { useServer } from "@/hooks/useServer";
import { supabase } from "@/integrations/supabase/client";

interface Conv { id: string; channel_name: string | null; user_display_name: string | null; title: string | null; last_message_at: string; }
interface Msg { id: string; role: string; author_name: string | null; content: string; created_at: string; }

export default function Conversations() {
  const { current } = useServer();
  const [convs, setConvs] = useState<Conv[]>([]);
  const [active, setActive] = useState<Conv | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!current) return;
    supabase.from("conversations").select("*").eq("server_id", current.id).order("last_message_at", { ascending: false }).limit(50)
      .then(({ data }) => setConvs((data as any) ?? []));
  }, [current?.id]);

  useEffect(() => {
    if (!active) return;
    supabase.from("messages").select("*").eq("conversation_id", active.id).order("created_at").limit(200)
      .then(({ data }) => setMessages((data as any) ?? []));

    const ch = supabase.channel(`messages-${active.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${active.id}` },
        (payload) => setMessages((m) => [...m, payload.new as Msg]))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [active?.id]);

  const filtered = convs.filter(c =>
    !q || (c.title ?? "").toLowerCase().includes(q.toLowerCase()) ||
    (c.user_display_name ?? "").toLowerCase().includes(q.toLowerCase()) ||
    (c.channel_name ?? "").toLowerCase().includes(q.toLowerCase())
  );

  return (
    <>
      <PageHeader title="Conversas" subtitle="Realtime via Supabase" icon={<MessagesSquare className="h-5 w-5 text-primary-foreground" />} />
      <div className="grid gap-4 lg:grid-cols-[320px,1fr]">
        <Card className="glass-panel flex h-[70vh] flex-col">
          <div className="border-b border-border p-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-8 h-9" />
            </div>
          </div>
          <div className="scrollbar-thin flex-1 overflow-y-auto">
            {filtered.length === 0 && (
              <div className="p-6 text-center text-xs text-muted-foreground">Nenhuma conversa.</div>
            )}
            {filtered.map((c) => (
              <button key={c.id} onClick={() => setActive(c)}
                className={`w-full border-b border-border/50 p-3 text-left transition-colors hover:bg-accent/10 ${active?.id === c.id ? "bg-accent/20" : ""}`}>
                <div className="truncate text-sm font-medium">{c.title ?? c.user_display_name ?? "Conversa"}</div>
                <div className="truncate font-mono text-[10px] text-muted-foreground">
                  #{c.channel_name ?? "—"} · {new Date(c.last_message_at).toLocaleString()}
                </div>
              </button>
            ))}
          </div>
        </Card>

        <Card className="glass-panel flex h-[70vh] flex-col">
          {!active ? (
            <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
              Selecione uma conversa
            </div>
          ) : (
            <>
              <div className="border-b border-border p-4">
                <div className="font-display font-semibold">{active.title ?? active.user_display_name}</div>
                <div className="font-mono text-[10px] text-muted-foreground">#{active.channel_name}</div>
              </div>
              <div className="scrollbar-thin flex-1 space-y-3 overflow-y-auto p-4">
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.role === "assistant" ? "justify-start" : "justify-end"}`}>
                    <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                      m.role === "assistant" ? "bg-secondary" : "bg-gradient-primary text-primary-foreground"
                    }`}>
                      <div className="mb-0.5 font-mono text-[9px] uppercase opacity-70">{m.author_name ?? m.role}</div>
                      {m.content}
                    </div>
                  </div>
                ))}
                {messages.length === 0 && (
                  <div className="text-center text-xs text-muted-foreground">Sem mensagens.</div>
                )}
              </div>
            </>
          )}
        </Card>
      </div>
    </>
  );
}
