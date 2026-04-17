import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bot, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function AuthPage() {
  const { signInWithDiscord, signInDemo, signUpDemo, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) {
    navigate("/dashboard", { replace: true });
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await signInDemo(email, password);
    setBusy(false);
    if (error) toast.error(error.message);
    else navigate("/dashboard");
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await signUpDemo(email, password);
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success("Conta criada! Você já está logado.");
  };

  const handleDiscord = async () => {
    try {
      await signInWithDiscord();
    } catch (e: any) {
      toast.error("Discord OAuth não está configurado ainda. Use email/senha por enquanto.");
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <div className="absolute inset-0 -z-10 opacity-60" style={{ backgroundImage: "var(--gradient-glow)" }} />

      <div className="grid w-full max-w-5xl gap-10 lg:grid-cols-2 lg:items-center">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground backdrop-blur">
            <Sparkles className="h-3 w-3 text-primary" /> control panel · v1.0
          </div>
          <h1 className="font-display text-4xl font-bold leading-tight md:text-5xl">
            Controle total do <span className="text-gradient">seu bot Discord</span> com IA
          </h1>
          <p className="max-w-md text-muted-foreground">
            Painel SaaS em tempo real para gerenciar IA, memória, conversas, tickets, moderação e analytics — tudo
            sincronizado via Supabase Realtime.
          </p>
          <div className="grid gap-3 font-mono text-xs text-muted-foreground">
            <div>→ IA configurável (Groq, prompts, memória)</div>
            <div>→ Realtime sem refresh</div>
            <div>→ RLS + permissões por servidor</div>
          </div>
        </div>

        <Card className="glass-panel p-6 md:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary glow-primary">
              <Bot className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <div className="font-display font-semibold">NEURAL.BOT</div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Acesso ao painel</div>
            </div>
          </div>

          <Button onClick={handleDiscord} className="mb-4 w-full bg-[#5865F2] hover:bg-[#4752c4] text-white" size="lg">
            Continuar com Discord
          </Button>

          <div className="relative my-4 flex items-center">
            <div className="flex-1 border-t border-border" />
            <span className="px-3 font-mono text-[10px] uppercase text-muted-foreground">ou</span>
            <div className="flex-1 border-t border-border" />
          </div>

          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar conta</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-3 pt-4">
                <div className="space-y-1">
                  <Label className="font-mono text-[10px] uppercase">Email</Label>
                  <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="font-mono text-[10px] uppercase">Senha</Label>
                  <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button type="submit" className="w-full bg-gradient-primary" disabled={busy}>
                  {busy ? "..." : "Entrar"}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-3 pt-4">
                <div className="space-y-1">
                  <Label className="font-mono text-[10px] uppercase">Email</Label>
                  <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="font-mono text-[10px] uppercase">Senha</Label>
                  <Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button type="submit" className="w-full bg-gradient-primary" disabled={busy}>
                  {busy ? "..." : "Criar conta"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
