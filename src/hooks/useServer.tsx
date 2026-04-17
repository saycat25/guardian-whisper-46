import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface ServerLite {
  id: string;
  name: string;
  icon_url: string | null;
  discord_guild_id: string;
}

interface ServerCtx {
  servers: ServerLite[];
  current: ServerLite | null;
  setCurrent: (s: ServerLite) => void;
  loading: boolean;
  refresh: () => Promise<void>;
  createDemoServer: () => Promise<void>;
}

const Ctx = createContext<ServerCtx | undefined>(undefined);

export const ServerProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [servers, setServers] = useState<ServerLite[]>([]);
  const [current, setCurrentState] = useState<ServerLite | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!user) {
      setServers([]);
      setCurrentState(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("servers")
      .select("id,name,icon_url,discord_guild_id")
      .order("created_at", { ascending: true });
    const list = (data as ServerLite[]) || [];
    setServers(list);
    setCurrentState((prev) => prev && list.find((s) => s.id === prev.id) ? prev : list[0] ?? null);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const setCurrent = (s: ServerLite) => setCurrentState(s);

  const createDemoServer = async () => {
    if (!user) return;
    const guildId = `demo-${Math.random().toString(36).slice(2, 10)}`;
    const { data: srv, error } = await supabase
      .from("servers")
      .insert({ discord_guild_id: guildId, name: "Meu Servidor Demo", owner_user_id: user.id })
      .select()
      .single();
    if (error || !srv) return;
    await supabase.from("user_roles").insert({ user_id: user.id, server_id: srv.id, role: "owner" });
    await supabase.from("ai_configs").insert({ server_id: srv.id });
    await supabase.from("bot_settings").insert({ server_id: srv.id });
    await refresh();
  };

  return (
    <Ctx.Provider value={{ servers, current, setCurrent, loading, refresh, createDemoServer }}>
      {children}
    </Ctx.Provider>
  );
};

export const useServer = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useServer must be used within ServerProvider");
  return c;
};
