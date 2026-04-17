import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useServer } from "@/hooks/useServer";
import { supabase } from "@/integrations/supabase/client";
import {
  Activity, MessagesSquare, Shield, Users, Zap, Plus, ArrowUpRight,
} from "lucide-react";
import { EmptyState } from "@/components/EmptyState";

interface Stats {
  messages: number;
  conversations: number;
  modAlerts: number;
  tickets: number;
}

export default function Dashboard() {
  const { current, createDemoServer } = useServer();
  const [stats, setStats] = useState<Stats>({ messages: 0, conversations: 0, modAlerts: 0, tickets: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!current) return;
    setLoading(true);
    (async () => {
      const [m, c, mod, t] = await Promise.all([
        supabase.from("messages").select("*", { count: "exact", head: true }).eq("server_id", current.id),
        supabase.from("conversations").select("*", { count: "exact", head: true }).eq("server_id", current.id),
        supabase.from("mod_logs").select("*", { count: "exact", head: true }).eq("server_id", current.id),
        supabase.from("tickets").select("*", { count: "exact", head: true }).eq("server_id", current.id).neq("status", "closed"),
      ]);
      setStats({
        messages: m.count ?? 0,
        conversations: c.count ?? 0,
        modAlerts: mod.count ?? 0,
        tickets: t.count ?? 0,
      });
      setLoading(false);
    })();
  }, [current?.id]);

  if (!current) {
    return (
      <>
        <PageHeader title="Dashboard" subtitle="Visão geral do bot" icon={<Activity className="h-5 w-5 text-primary-foreground" />} />
        <EmptyState
          icon={<Plus className="h-6 w-6" />}
          title="Nenhum servidor conectado"
          description="Crie um servidor demo para começar a explorar o painel. Quando o login Discord estiver configurado, seus servidores aparecerão automaticamente."
          action={<Button onClick={createDemoServer} className="bg-gradient-primary">Criar servidor demo</Button>}
        />
      </>
    );
  }

  const cards = [
    { label: "Mensagens", value: stats.messages, icon: MessagesSquare, color: "text-info" },
    { label: "Conversas", value: stats.conversations, icon: Users, color: "text-primary" },
    { label: "Alertas mod", value: stats.modAlerts, icon: Shield, color: "text-warning" },
    { label: "Tickets ativos", value: stats.tickets, icon: Zap, color: "text-accent" },
  ];

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={`Servidor: ${current.name}`}
        icon={<Activity className="h-5 w-5 text-primary-foreground" />}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label} className="glass-panel p-5">
            <div className="flex items-center justify-between">
              <c.icon className={`h-4 w-4 ${c.color}`} />
              <ArrowUpRight className="h-3 w-3 text-muted-foreground" />
            </div>
            <div className="mt-4 font-display text-3xl font-bold">{loading ? "—" : c.value}</div>
            <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{c.label}</div>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="glass-panel col-span-2 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display font-semibold">Atividade ao vivo</h3>
            <span className="font-mono text-[10px] uppercase text-muted-foreground">realtime</span>
          </div>
          <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
            Aguardando eventos do bot…
          </div>
        </Card>
        <Card className="glass-panel p-6">
          <h3 className="mb-4 font-display font-semibold">Status do bot</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Conexão</span>
              <span className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-glow" />
                Online
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">IA</span>
              <span className="font-mono text-xs">Groq · llama-3.3</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Realtime</span>
              <span className="text-success">ativo</span>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
