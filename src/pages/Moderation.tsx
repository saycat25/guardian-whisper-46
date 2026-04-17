import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Shield } from "lucide-react";
import { useServer } from "@/hooks/useServer";
import { supabase } from "@/integrations/supabase/client";

interface ML { id: string; user_display_name: string | null; action: string; reason: string | null; severity: string; toxicity_score: number | null; created_at: string; }

export default function Moderation() {
  const { current } = useServer();
  const [logs, setLogs] = useState<ML[]>([]);

  useEffect(() => {
    if (!current) return;
    supabase.from("mod_logs").select("*").eq("server_id", current.id).order("created_at", { ascending: false }).limit(100)
      .then(({ data }) => setLogs((data as any) ?? []));
    const ch = supabase.channel(`mod-${current.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "mod_logs", filter: `server_id=eq.${current.id}` },
        (p) => setLogs((l) => [p.new as ML, ...l]))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [current?.id]);

  const sevClass = (s: string) =>
    s === "critical" ? "bg-destructive/20 text-destructive border-destructive/30" :
    s === "high" ? "bg-warning/20 text-warning border-warning/30" :
    s === "medium" ? "bg-info/20 text-info border-info/30" :
    "bg-muted text-muted-foreground border-border";

  return (
    <>
      <PageHeader title="Moderação" subtitle="Alertas e toxicidade em tempo real" icon={<Shield className="h-5 w-5 text-primary-foreground" />} />
      {logs.length === 0 ? (
        <Card className="glass-panel p-12 text-center text-sm text-muted-foreground">
          Sem alertas. Está tudo tranquilo. ✨
        </Card>
      ) : (
        <div className="space-y-2">
          {logs.map((l) => (
            <Card key={l.id} className="glass-panel flex items-center gap-4 p-4">
              <span className={`rounded-md border px-2 py-0.5 font-mono text-[10px] uppercase ${sevClass(l.severity)}`}>
                {l.severity}
              </span>
              <div className="flex-1">
                <div className="text-sm font-medium">{l.action}</div>
                <div className="font-mono text-[10px] text-muted-foreground">
                  {l.user_display_name ?? "—"} · {new Date(l.created_at).toLocaleString()}
                </div>
                {l.reason && <div className="mt-1 text-xs text-muted-foreground">{l.reason}</div>}
              </div>
              {l.toxicity_score !== null && (
                <div className="text-right font-mono">
                  <div className="text-lg text-destructive">{(l.toxicity_score * 100).toFixed(0)}%</div>
                  <div className="text-[9px] uppercase text-muted-foreground">tox</div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
