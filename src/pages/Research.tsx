import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useServer } from "@/hooks/useServer";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RH { id: string; query: string; result: string | null; created_at: string; }

export default function Research() {
  const { current } = useServer();
  const { user } = useAuth();
  const [history, setHistory] = useState<RH[]>([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!current) return;
    const { data } = await supabase.from("research_history").select("*")
      .eq("server_id", current.id).order("created_at", { ascending: false }).limit(30);
    setHistory((data as any) ?? []);
  };

  useEffect(() => { load(); }, [current?.id]);

  const run = async () => {
    if (!current || !user || !q.trim()) return;
    setBusy(true);
    const { error } = await supabase.from("research_history").insert({
      server_id: current.id, user_id: user.id, query: q,
      result: "Pesquisa enfileirada — o bot processará e atualizará este registro.",
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    setQ("");
    load();
  };

  return (
    <>
      <PageHeader title="DeepResearch" subtitle="Pesquisas profundas com histórico" icon={<Search className="h-5 w-5 text-primary-foreground" />} />

      <Card className="glass-panel mb-4 flex gap-2 p-4">
        <Input placeholder="O que você quer pesquisar?" value={q} onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && run()} />
        <Button onClick={run} disabled={busy} className="bg-gradient-primary">Pesquisar</Button>
      </Card>

      <div className="space-y-3">
        {history.length === 0 && (
          <Card className="glass-panel p-8 text-center text-sm text-muted-foreground">Sem pesquisas ainda.</Card>
        )}
        {history.map((h) => (
          <Card key={h.id} className="glass-panel p-4">
            <div className="font-mono text-[10px] uppercase text-muted-foreground">
              {new Date(h.created_at).toLocaleString()}
            </div>
            <div className="mt-1 font-medium">{h.query}</div>
            {h.result && <div className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{h.result}</div>}
          </Card>
        ))}
      </div>
    </>
  );
}
