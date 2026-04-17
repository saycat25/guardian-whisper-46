import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Brain, Save, Plus, Trash2 } from "lucide-react";
import { useServer } from "@/hooks/useServer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AIConfig {
  id?: string;
  model: string;
  temperature: number;
  style: string;
  adaptation_level: number;
  enabled: boolean;
}

interface Prompt {
  id: string;
  scope: string;
  scope_ref: string | null;
  name: string;
  content: string;
  enabled: boolean;
}

export default function AI() {
  const { current } = useServer();
  const [cfg, setCfg] = useState<AIConfig | null>(null);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!current) return;
    const { data: c } = await supabase.from("ai_configs").select("*").eq("server_id", current.id).maybeSingle();
    setCfg((c as any) ?? { model: "llama-3.3-70b-versatile", temperature: 0.7, style: "balanced", adaptation_level: 50, enabled: true });
    const { data: p } = await supabase.from("prompts").select("*").eq("server_id", current.id).order("created_at");
    setPrompts((p as any) ?? []);
  };

  useEffect(() => { load(); }, [current?.id]);

  const save = async () => {
    if (!current || !cfg) return;
    setSaving(true);
    const payload = { ...cfg, server_id: current.id };
    const { error } = await supabase.from("ai_configs").upsert(payload, { onConflict: "server_id" });
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Configuração salva");
  };

  const addPrompt = async (scope: string) => {
    if (!current) return;
    const { data, error } = await supabase
      .from("prompts")
      .insert({ server_id: current.id, scope, name: "Novo prompt", content: "Você é um assistente útil…" })
      .select()
      .single();
    if (error) return toast.error(error.message);
    setPrompts((p) => [...p, data as any]);
  };

  const updatePrompt = async (id: string, patch: Partial<Prompt>) => {
    setPrompts((ps) => ps.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    await supabase.from("prompts").update(patch).eq("id", id);
  };

  const deletePrompt = async (id: string) => {
    setPrompts((ps) => ps.filter((p) => p.id !== id));
    await supabase.from("prompts").delete().eq("id", id);
  };

  if (!current) {
    return <PageHeader title="IA" subtitle="Selecione um servidor" icon={<Brain className="h-5 w-5 text-primary-foreground" />} />;
  }

  return (
    <>
      <PageHeader
        title="Painel de IA"
        subtitle="Modelo, prompts, memória e auto-adaptação"
        icon={<Brain className="h-5 w-5 text-primary-foreground" />}
        actions={<Button onClick={save} disabled={saving} className="bg-gradient-primary"><Save className="mr-2 h-4 w-4" />Salvar</Button>}
      />

      <Tabs defaultValue="control">
        <TabsList>
          <TabsTrigger value="control">Controle</TabsTrigger>
          <TabsTrigger value="prompts">Prompts</TabsTrigger>
          <TabsTrigger value="adapt">Auto-Adaptação</TabsTrigger>
        </TabsList>

        <TabsContent value="control">
          {cfg && (
            <Card className="glass-panel grid gap-6 p-6 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <Label className="font-mono text-[10px] uppercase">Modelo (Groq)</Label>
                  <Select value={cfg.model} onValueChange={(v) => setCfg({ ...cfg, model: v })}>
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="llama-3.3-70b-versatile">llama-3.3-70b-versatile</SelectItem>
                      <SelectItem value="llama-3.1-70b-versatile">llama-3.1-70b-versatile</SelectItem>
                      <SelectItem value="llama-3.1-8b-instant">llama-3.1-8b-instant</SelectItem>
                      <SelectItem value="mixtral-8x7b-32768">mixtral-8x7b-32768</SelectItem>
                      <SelectItem value="gemma2-9b-it">gemma2-9b-it</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="font-mono text-[10px] uppercase">Estilo</Label>
                  <Select value={cfg.style} onValueChange={(v) => setCfg({ ...cfg, style: v })}>
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="balanced">Balanceado</SelectItem>
                      <SelectItem value="formal">Formal</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="creative">Criativo</SelectItem>
                      <SelectItem value="technical">Técnico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <div className="text-sm font-medium">IA habilitada</div>
                    <div className="font-mono text-[10px] uppercase text-muted-foreground">on/off global</div>
                  </div>
                  <Switch checked={cfg.enabled} onCheckedChange={(v) => setCfg({ ...cfg, enabled: v })} />
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <Label className="font-mono text-[10px] uppercase">Temperatura</Label>
                    <span className="font-mono text-sm text-primary">{cfg.temperature.toFixed(2)}</span>
                  </div>
                  <Slider
                    min={0} max={2} step={0.05}
                    value={[cfg.temperature]}
                    onValueChange={([v]) => setCfg({ ...cfg, temperature: v })}
                  />
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <Label className="font-mono text-[10px] uppercase">Nível de adaptação</Label>
                    <span className="font-mono text-sm text-accent">{cfg.adaptation_level}%</span>
                  </div>
                  <Slider
                    min={0} max={100} step={1}
                    value={[cfg.adaptation_level]}
                    onValueChange={([v]) => setCfg({ ...cfg, adaptation_level: v })}
                  />
                </div>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="prompts" className="space-y-4">
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => addPrompt("global")}><Plus className="mr-1 h-3 w-3" />Global</Button>
            <Button size="sm" variant="outline" onClick={() => addPrompt("channel")}><Plus className="mr-1 h-3 w-3" />Por canal</Button>
            <Button size="sm" variant="outline" onClick={() => addPrompt("role")}><Plus className="mr-1 h-3 w-3" />Por função</Button>
          </div>
          {prompts.length === 0 && (
            <Card className="glass-panel p-8 text-center text-sm text-muted-foreground">
              Nenhum prompt criado ainda.
            </Card>
          )}
          {prompts.map((p) => (
            <Card key={p.id} className="glass-panel space-y-3 p-4">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-primary/10 px-2 py-0.5 font-mono text-[10px] uppercase text-primary">
                  {p.scope}
                </span>
                <Input
                  value={p.name}
                  onChange={(e) => updatePrompt(p.id, { name: e.target.value })}
                  className="h-8 max-w-xs"
                />
                {(p.scope === "channel" || p.scope === "role") && (
                  <Input
                    placeholder={p.scope === "channel" ? "ID do canal" : "ID da função"}
                    value={p.scope_ref ?? ""}
                    onChange={(e) => updatePrompt(p.id, { scope_ref: e.target.value })}
                    className="h-8 max-w-xs font-mono text-xs"
                  />
                )}
                <div className="ml-auto flex items-center gap-2">
                  <Switch checked={p.enabled} onCheckedChange={(v) => updatePrompt(p.id, { enabled: v })} />
                  <Button size="icon" variant="ghost" onClick={() => deletePrompt(p.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
              <Textarea
                value={p.content}
                onChange={(e) => updatePrompt(p.id, { content: e.target.value })}
                rows={4}
                className="font-mono text-xs"
              />
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="adapt">
          <Card className="glass-panel p-6">
            <p className="text-sm text-muted-foreground">
              A IA adapta automaticamente seu tom e estilo conforme as conversas. Histórico de mudanças aparecerá aqui
              quando o bot começar a registrar adaptações.
            </p>
            <div className="mt-4 rounded-lg border border-dashed border-border p-8 text-center font-mono text-xs text-muted-foreground">
              Sem registros ainda
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
