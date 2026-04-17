import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings as SettingsIcon, Save } from "lucide-react";
import { useServer } from "@/hooks/useServer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BotSettings {
  modules: Record<string, boolean>;
  prefix: string;
  language: string;
}

export default function Settings() {
  const { current } = useServer();
  const [s, setS] = useState<BotSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!current) return;
    supabase.from("bot_settings").select("*").eq("server_id", current.id).maybeSingle()
      .then(({ data }) => {
        setS((data as any) ?? { modules: { ai: true, moderation: true, tickets: true, analytics: true, research: true, multimodal: true }, prefix: "!", language: "pt-BR" });
      });
  }, [current?.id]);

  const save = async () => {
    if (!current || !s) return;
    setSaving(true);
    const { error } = await supabase.from("bot_settings").upsert({ ...s, server_id: current.id }, { onConflict: "server_id" });
    setSaving(false);
    if (error) toast.error(error.message); else toast.success("Configurações salvas");
  };

  if (!current || !s) return <PageHeader title="Configurações" icon={<SettingsIcon className="h-5 w-5 text-primary-foreground" />} />;

  const modules = Object.keys(s.modules);

  return (
    <>
      <PageHeader title="Configurações" subtitle="Controle total do bot via banco"
        icon={<SettingsIcon className="h-5 w-5 text-primary-foreground" />}
        actions={<Button onClick={save} disabled={saving} className="bg-gradient-primary"><Save className="mr-2 h-4 w-4" />Salvar</Button>}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="glass-panel space-y-4 p-6">
          <h3 className="font-display font-semibold">Geral</h3>
          <div>
            <Label className="font-mono text-[10px] uppercase">Prefixo</Label>
            <Input value={s.prefix} onChange={(e) => setS({ ...s, prefix: e.target.value })} className="mt-1.5 font-mono" />
          </div>
          <div>
            <Label className="font-mono text-[10px] uppercase">Idioma</Label>
            <Input value={s.language} onChange={(e) => setS({ ...s, language: e.target.value })} className="mt-1.5 font-mono" />
          </div>
        </Card>

        <Card className="glass-panel space-y-3 p-6">
          <h3 className="font-display font-semibold">Módulos</h3>
          {modules.map((m) => (
            <div key={m} className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <div className="text-sm font-medium capitalize">{m}</div>
                <div className="font-mono text-[10px] uppercase text-muted-foreground">module.{m}</div>
              </div>
              <Switch
                checked={!!s.modules[m]}
                onCheckedChange={(v) => setS({ ...s, modules: { ...s.modules, [m]: v } })}
              />
            </div>
          ))}
        </Card>
      </div>
    </>
  );
}
