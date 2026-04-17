import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { useServer } from "@/hooks/useServer";
import { supabase } from "@/integrations/supabase/client";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";

interface Point { date: string; value: number; }

export default function Analytics() {
  const { current } = useServer();
  const [data, setData] = useState<Point[]>([]);
  const [totals, setTotals] = useState({ messages: 0, users: 0, events: 0 });

  useEffect(() => {
    if (!current) return;
    (async () => {
      // Daily counts of messages over last 14 days (client-side aggregation)
      const since = new Date(); since.setDate(since.getDate() - 13);
      const { data: m } = await supabase.from("messages").select("created_at,author_name")
        .eq("server_id", current.id).gte("created_at", since.toISOString());
      const buckets = new Map<string, number>();
      for (let i = 0; i < 14; i++) {
        const d = new Date(); d.setDate(d.getDate() - (13 - i));
        buckets.set(d.toISOString().slice(5, 10), 0);
      }
      const users = new Set<string>();
      (m ?? []).forEach((row: any) => {
        const k = new Date(row.created_at).toISOString().slice(5, 10);
        buckets.set(k, (buckets.get(k) ?? 0) + 1);
        if (row.author_name) users.add(row.author_name);
      });
      setData(Array.from(buckets.entries()).map(([date, value]) => ({ date, value })));
      const { count: ev } = await supabase.from("analytics_events").select("*", { count: "exact", head: true }).eq("server_id", current.id);
      setTotals({ messages: m?.length ?? 0, users: users.size, events: ev ?? 0 });
    })();
  }, [current?.id]);

  return (
    <>
      <PageHeader title="Analytics" subtitle="Uso, mensagens e usuários" icon={<BarChart3 className="h-5 w-5 text-primary-foreground" />} />

      <div className="mb-4 grid grid-cols-3 gap-4">
        {[
          { l: "Mensagens 14d", v: totals.messages },
          { l: "Usuários únicos", v: totals.users },
          { l: "Eventos", v: totals.events },
        ].map((c) => (
          <Card key={c.l} className="glass-panel p-5">
            <div className="font-mono text-[10px] uppercase text-muted-foreground">{c.l}</div>
            <div className="mt-2 font-display text-3xl font-bold">{c.v}</div>
          </Card>
        ))}
      </div>

      <Card className="glass-panel p-6">
        <h3 className="mb-4 font-display font-semibold">Mensagens por dia</h3>
        <div className="h-72">
          <ResponsiveContainer>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fill="url(#g1)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </>
  );
}
