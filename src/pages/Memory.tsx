import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Database, Trash2, Plus } from "lucide-react";
import { useServer } from "@/hooks/useServer";
import { supabase } from "@/integrations/supabase/client";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface MemEntry { id: string; kind: string; key: string | null; content: string; created_at: string; }

export default function Memory() {
  const { current } = useServer();
  const [entries, setEntries] = useState<MemEntry[]>([]);
  const [kind, setKind] = useState<"short" | "persistent">("persistent");
  const [draft, setDraft] = useState("");

  const load = async () => {
    if (!current) return;
    const { data } = await supabase
      .from("memory_entries")
      .select("*").eq("server_id", current.id).eq("kind", kind)
      .order("created_at", { ascending: false }).limit(100);
    setEntries((data as any) ?? []);
  };

  useEffect(() => { load(); }, [current?.id, kind]);

  const add = async () => {
    if (!current || !draft.trim()) return;
    const { error } = await supabase.from("memory_entries").insert({ server_id: current.id, kind, content: draft });
    if (error) return toast.error(error.message);
    setDraft("");
    load();
  };

  const remove = async (id: string) => {
    await supabase.from("memory_entries").delete().eq("id", id);
    setEntries((e) => e.filter((x) => x.id !== id));
  };

  const clearAll = async () => {
    if (!current) return;
    if (!confirm("Limpar toda a memória " + kind + "?")) return;
    await supabase.from("memory_entries").delete().eq("server_id", current.id).eq("kind", kind);
    load();
  };

  if (!current) return <PageHeader title="Memória" icon={<Database className="h-5 w-5 text-primary-foreground" />} />;

  return (
    <>
      <PageHeader
        title="Memória"
        subtitle="Curto prazo e persistente"
        icon={<Database className="h-5 w-5 text-primary-foreground" />}
        actions={<Button variant="outline" onClick={clearAll}><Trash2 className="mr-2 h-4 w-4" />Limpar tudo</Button>}
      />

      <Tabs value={kind} onValueChange={(v) => setKind(v as any)}>
        <TabsList>
          <TabsTrigger value="persistent">Persistente</TabsTrigger>
          <TabsTrigger value="short">Curto prazo</TabsTrigger>
        </TabsList>
        <TabsContent value={kind} className="space-y-4">
          <Card className="glass-panel space-y-3 p-4">
            <Textarea placeholder="Nova entrada de memória…" value={draft} onChange={(e) => setDraft(e.target.value)} rows={3} className="font-mono text-xs" />
            <Button onClick={add} className="bg-gradient-primary"><Plus className="mr-2 h-4 w-4" />Adicionar</Button>
          </Card>

          {entries.length === 0 && (
            <Card className="glass-panel p-8 text-center text-sm text-muted-foreground">
              Sem entradas {kind === "short" ? "de curto prazo" : "persistentes"} ainda.
            </Card>
          )}

          {entries.map((e) => (
            <Card key={e.id} className="glass-panel flex items-start justify-between gap-3 p-4">
              <div className="flex-1 space-y-1">
                <div className="font-mono text-[10px] uppercase text-muted-foreground">
                  {new Date(e.created_at).toLocaleString()}
                </div>
                <div className="text-sm">{e.content}</div>
              </div>
              <Button size="icon" variant="ghost" onClick={() => remove(e.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </>
  );
}
