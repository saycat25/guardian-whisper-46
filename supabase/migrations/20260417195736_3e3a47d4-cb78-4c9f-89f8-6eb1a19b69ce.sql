-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'moderator', 'viewer');
CREATE TYPE public.ticket_status AS ENUM ('open', 'pending', 'resolved', 'closed');
CREATE TYPE public.message_role AS ENUM ('user', 'assistant', 'system');
CREATE TYPE public.mod_severity AS ENUM ('low', 'medium', 'high', 'critical');

-- ============ UTIL: updated_at ============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  discord_id TEXT,
  username TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, discord_id, username, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'provider_id',
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ SERVERS ============
CREATE TABLE public.servers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discord_guild_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  icon_url TEXT,
  owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.servers ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_servers_updated BEFORE UPDATE ON public.servers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ USER ROLES (per server) ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  server_id UUID NOT NULL REFERENCES public.servers(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, server_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer helpers (avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.has_server_access(_user_id UUID, _server_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND server_id = _server_id);
$$;

CREATE OR REPLACE FUNCTION public.has_server_role(_user_id UUID, _server_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND server_id = _server_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_server_admin(_user_id UUID, _server_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND server_id = _server_id AND role IN ('owner','admin'));
$$;

-- RLS for user_roles
CREATE POLICY "Users see their roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Server admins see server roles" ON public.user_roles FOR SELECT USING (public.is_server_admin(auth.uid(), server_id));
CREATE POLICY "Server admins manage roles" ON public.user_roles FOR ALL USING (public.is_server_admin(auth.uid(), server_id)) WITH CHECK (public.is_server_admin(auth.uid(), server_id));

-- RLS for servers
CREATE POLICY "Users view servers they belong to" ON public.servers FOR SELECT USING (public.has_server_access(auth.uid(), id));
CREATE POLICY "Owners insert servers" ON public.servers FOR INSERT WITH CHECK (auth.uid() = owner_user_id);
CREATE POLICY "Server admins update server" ON public.servers FOR UPDATE USING (public.is_server_admin(auth.uid(), id));
CREATE POLICY "Server owners delete" ON public.servers FOR DELETE USING (auth.uid() = owner_user_id);

-- ============ AI CONFIGS ============
CREATE TABLE public.ai_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID NOT NULL UNIQUE REFERENCES public.servers(id) ON DELETE CASCADE,
  model TEXT NOT NULL DEFAULT 'llama-3.3-70b-versatile',
  temperature NUMERIC(3,2) NOT NULL DEFAULT 0.7,
  style TEXT NOT NULL DEFAULT 'balanced',
  adaptation_level INT NOT NULL DEFAULT 50,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view ai_configs" ON public.ai_configs FOR SELECT USING (public.has_server_access(auth.uid(), server_id));
CREATE POLICY "Admins manage ai_configs" ON public.ai_configs FOR ALL USING (public.is_server_admin(auth.uid(), server_id)) WITH CHECK (public.is_server_admin(auth.uid(), server_id));
CREATE TRIGGER trg_ai_configs_updated BEFORE UPDATE ON public.ai_configs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ PROMPTS ============
CREATE TABLE public.prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID NOT NULL REFERENCES public.servers(id) ON DELETE CASCADE,
  scope TEXT NOT NULL CHECK (scope IN ('global','channel','role')),
  scope_ref TEXT,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_prompts_server ON public.prompts(server_id);
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view prompts" ON public.prompts FOR SELECT USING (public.has_server_access(auth.uid(), server_id));
CREATE POLICY "Admins manage prompts" ON public.prompts FOR ALL USING (public.is_server_admin(auth.uid(), server_id)) WITH CHECK (public.is_server_admin(auth.uid(), server_id));
CREATE TRIGGER trg_prompts_updated BEFORE UPDATE ON public.prompts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ MEMORY ============
CREATE TABLE public.memory_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID NOT NULL REFERENCES public.servers(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('short','persistent')),
  key TEXT,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_memory_server ON public.memory_entries(server_id, kind);
ALTER TABLE public.memory_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view memory" ON public.memory_entries FOR SELECT USING (public.has_server_access(auth.uid(), server_id));
CREATE POLICY "Admins manage memory" ON public.memory_entries FOR ALL USING (public.is_server_admin(auth.uid(), server_id)) WITH CHECK (public.is_server_admin(auth.uid(), server_id));
CREATE TRIGGER trg_memory_updated BEFORE UPDATE ON public.memory_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ CONVERSATIONS / MESSAGES ============
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID NOT NULL REFERENCES public.servers(id) ON DELETE CASCADE,
  channel_id TEXT,
  channel_name TEXT,
  user_discord_id TEXT,
  user_display_name TEXT,
  title TEXT,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_conv_server ON public.conversations(server_id, last_message_at DESC);
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view conversations" ON public.conversations FOR SELECT USING (public.has_server_access(auth.uid(), server_id));
CREATE POLICY "Admins manage conversations" ON public.conversations FOR ALL USING (public.is_server_admin(auth.uid(), server_id)) WITH CHECK (public.is_server_admin(auth.uid(), server_id));

CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  server_id UUID NOT NULL REFERENCES public.servers(id) ON DELETE CASCADE,
  role message_role NOT NULL,
  author_name TEXT,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_messages_conv ON public.messages(conversation_id, created_at);
CREATE INDEX idx_messages_server ON public.messages(server_id, created_at DESC);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view messages" ON public.messages FOR SELECT USING (public.has_server_access(auth.uid(), server_id));
CREATE POLICY "Admins insert messages" ON public.messages FOR INSERT WITH CHECK (public.is_server_admin(auth.uid(), server_id));

-- ============ TICKETS ============
CREATE TABLE public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID NOT NULL REFERENCES public.servers(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  status ticket_status NOT NULL DEFAULT 'open',
  user_discord_id TEXT,
  user_display_name TEXT,
  channel_id TEXT,
  priority INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_tickets_server ON public.tickets(server_id, status);
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view tickets" ON public.tickets FOR SELECT USING (public.has_server_access(auth.uid(), server_id));
CREATE POLICY "Mods manage tickets" ON public.tickets FOR ALL USING (public.has_server_access(auth.uid(), server_id)) WITH CHECK (public.has_server_access(auth.uid(), server_id));
CREATE TRIGGER trg_tickets_updated BEFORE UPDATE ON public.tickets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  server_id UUID NOT NULL REFERENCES public.servers(id) ON DELETE CASCADE,
  role message_role NOT NULL,
  author_name TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ticket_msgs ON public.ticket_messages(ticket_id, created_at);
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view ticket msgs" ON public.ticket_messages FOR SELECT USING (public.has_server_access(auth.uid(), server_id));
CREATE POLICY "Members add ticket msgs" ON public.ticket_messages FOR INSERT WITH CHECK (public.has_server_access(auth.uid(), server_id));

-- ============ MOD LOGS ============
CREATE TABLE public.mod_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID NOT NULL REFERENCES public.servers(id) ON DELETE CASCADE,
  user_discord_id TEXT,
  user_display_name TEXT,
  action TEXT NOT NULL,
  reason TEXT,
  severity mod_severity NOT NULL DEFAULT 'low',
  toxicity_score NUMERIC(4,3),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_mod_server ON public.mod_logs(server_id, created_at DESC);
ALTER TABLE public.mod_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view mod logs" ON public.mod_logs FOR SELECT USING (public.has_server_access(auth.uid(), server_id));
CREATE POLICY "Admins manage mod logs" ON public.mod_logs FOR ALL USING (public.is_server_admin(auth.uid(), server_id)) WITH CHECK (public.is_server_admin(auth.uid(), server_id));

-- ============ ANALYTICS ============
CREATE TABLE public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID NOT NULL REFERENCES public.servers(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  value NUMERIC DEFAULT 1,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_analytics_server ON public.analytics_events(server_id, created_at DESC);
CREATE INDEX idx_analytics_type ON public.analytics_events(server_id, event_type, created_at DESC);
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view analytics" ON public.analytics_events FOR SELECT USING (public.has_server_access(auth.uid(), server_id));
CREATE POLICY "Admins insert analytics" ON public.analytics_events FOR INSERT WITH CHECK (public.is_server_admin(auth.uid(), server_id));

-- ============ DEEP RESEARCH ============
CREATE TABLE public.research_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID NOT NULL REFERENCES public.servers(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  query TEXT NOT NULL,
  result TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.research_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view research" ON public.research_history FOR SELECT USING (public.has_server_access(auth.uid(), server_id));
CREATE POLICY "Members add research" ON public.research_history FOR INSERT WITH CHECK (public.has_server_access(auth.uid(), server_id) AND auth.uid() = user_id);

-- ============ BOT SETTINGS (modules) ============
CREATE TABLE public.bot_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID NOT NULL UNIQUE REFERENCES public.servers(id) ON DELETE CASCADE,
  modules JSONB NOT NULL DEFAULT '{"ai":true,"moderation":true,"tickets":true,"analytics":true,"research":true,"multimodal":true}'::jsonb,
  prefix TEXT DEFAULT '!',
  language TEXT DEFAULT 'pt-BR',
  raw JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.bot_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view bot settings" ON public.bot_settings FOR SELECT USING (public.has_server_access(auth.uid(), server_id));
CREATE POLICY "Admins manage bot settings" ON public.bot_settings FOR ALL USING (public.is_server_admin(auth.uid(), server_id)) WITH CHECK (public.is_server_admin(auth.uid(), server_id));
CREATE TRIGGER trg_bot_settings_updated BEFORE UPDATE ON public.bot_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ API USAGE ============
CREATE TABLE public.api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID NOT NULL REFERENCES public.servers(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  tokens INT DEFAULT 0,
  requests INT DEFAULT 1,
  cost_cents INT DEFAULT 0,
  period_start TIMESTAMPTZ NOT NULL DEFAULT date_trunc('day', now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_usage_server ON public.api_usage(server_id, period_start DESC);
ALTER TABLE public.api_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view usage" ON public.api_usage FOR SELECT USING (public.has_server_access(auth.uid(), server_id));
CREATE POLICY "Admins insert usage" ON public.api_usage FOR INSERT WITH CHECK (public.is_server_admin(auth.uid(), server_id));

-- ============ NOTIFICATIONS ============
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  server_id UUID REFERENCES public.servers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  level TEXT NOT NULL DEFAULT 'info',
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notif_user ON public.notifications(user_id, read, created_at DESC);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- ============ REALTIME ============
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.mod_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_messages;
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.mod_logs REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.tickets REPLICA IDENTITY FULL;
ALTER TABLE public.ticket_messages REPLICA IDENTITY FULL;