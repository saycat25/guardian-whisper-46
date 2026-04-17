import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Ticket as TicketIcon, Send } from "lucide-react";
import { useServer } from "@/hooks/useServer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Tk { id: string; subject: string; status: string; user_display_name: string | null; created_at: string; }
interface TMsg { id: string; role: string; author_name: string | null; content: string; created_at: string; }

export default function Tickets() {
  const { current } = useServer();
  const [tickets, setTickets] = useState<Tk[]>([]);
  const [active, setActive] = useState<Tk | null>(null);
  const [msgs, setMsgs] = useState<TMsg[]>([]);
  const [reply, setReply] = useState("");

  useEffect(() => {
    if (!current) return;
    supabase.from("tickets").select("*").eq("server_id", current.id).order("created_at", { ascending: false })
      .then(({ data }) => setTickets((data as any) ?? []));
  }, [current?.id]);

  useEffect(() => {
    if (!active) return;
    supabase.from("ticket_messages").select("*").eq("ticket_id", active.id).order("created_at")
      .then(({ data }) => setMsgs((data as any) ?? []));
    const ch = supabase.channel(`tk-${active.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "ticket_messages", filter: `ticket_id=eq.${active.id}` },
        (p) => setMsgs((m) => [...m, p.new as TMsg]))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [active?.id]);

  const send = async () => {
    if (!current || !active || !reply.trim()) return;
    const { error } = await supabase.from("ticket_messages").insert({
      ticket_id: active.id, server_id: current.id, role: "user", author_name: "Suporte", content: reply,
    });
    if (error) return toast.error(error.message);
    setReply("");
  };

  const statusColor = (s: string) => s === "open" ? "text-warning" : s === "resolved" ? "text-success" : "text-muted-foreground";

  return (
    <>
      <PageHeader title="Tickets" subtitle="Suporte com IA" icon={<TicketIcon className="h-5 w-5 text-primary-foreground" />} />
      <div className="grid gap-4 lg:grid-cols-[340px,1fr]">
        <Card className="glass-panel scrollbar-thin h-[70vh] overflow-y-auto">
          {tickets.length === 0 && <div className="p-6 text-center text-xs text-muted-foreground">Nenhum ticket.</div>}
          {tickets.map((t) => (
            <button key={t.id} onClick={() => setActive(t)}
              className={`block w-full border-b border-border/50 p-3 text-left hover:bg-accent/10 ${active?.id === t.id ? "bg-accent/20" : ""}`}>
              <div className="flex items-center justify-between">
                <div className="truncate text-sm font-medium">{t.subject}</div>
                <span className={`font-mono text-[9px] uppercase ${statusColor(t.status)}`}>{t.status}</span>
              </div>
              <div className="font-mono text-[10px] text-muted-foreground">{t.user_display_name ?? "Anônimo"}</div>
            </button>
          ))}
        </Card>

        <Card className="glass-panel flex h-[70vh] flex-col">
          {!active ? (
            <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">Selecione um ticket</div>
          ) : (
            <>
              <div className="border-b border-border p-4">
                <div className="font-display font-semibold">{active.subject}</div>
                <div className="font-mono text-[10px] text-muted-foreground">#{active.id.slice(0, 8)}</div>
              </div>
              <div className="scrollbar-thin flex-1 space-y-3 overflow-y-auto p-4">
                {msgs.map((m) => (
                  <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                      m.role === "user" ? "bg-gradient-primary text-primary-foreground" : "bg-secondary"
                    }`}>
                      <div className="mb-0.5 font-mono text-[9px] uppercase opacity-70">{m.author_name ?? m.role}</div>
                      {m.content}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 border-t border-border p-3">
                <Input placeholder="Responder…" value={reply} onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()} />
                <Button onClick={send} className="bg-gradient-primary"><Send className="h-4 w-4" /></Button>
              </div>
            </>
          )}
        </Card>
      </div>
    </>
  );
}
