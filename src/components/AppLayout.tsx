import { ReactNode } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { ServerSwitcher } from "./ServerSwitcher";
import { Button } from "@/components/ui/button";
import { Bell, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ServerProvider } from "@/hooks/useServer";

export function AppLayout({ children }: { children?: ReactNode }) {
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="font-mono text-xs text-muted-foreground">carregando…</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <ServerProvider>
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <div className="flex flex-1 flex-col">
            <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/70 px-4 backdrop-blur-xl">
              <SidebarTrigger />
              <ServerSwitcher />
              <div className="ml-auto flex items-center gap-2">
                <Button size="icon" variant="ghost" className="relative">
                  <Bell className="h-4 w-4" />
                  <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary animate-pulse-glow" />
                </Button>
                <div className="hidden items-center gap-2 md:flex">
                  <div className="text-right font-mono text-[10px] leading-tight">
                    <div className="text-foreground">{user.email}</div>
                    <div className="text-muted-foreground">authenticated</div>
                  </div>
                </div>
                <Button size="icon" variant="ghost" onClick={signOut}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </header>
            <main className="flex-1 p-6 animate-fade-in">{children ?? <Outlet />}</main>
          </div>
        </div>
      </SidebarProvider>
    </ServerProvider>
  );
}
