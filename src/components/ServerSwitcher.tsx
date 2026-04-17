import { useServer } from "@/hooks/useServer";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronsUpDown, Plus, Server } from "lucide-react";

export function ServerSwitcher() {
  const { servers, current, setCurrent, createDemoServer } = useServer();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="h-9 gap-2 font-mono text-xs">
          <Server className="h-3.5 w-3.5 text-primary" />
          <span className="max-w-[180px] truncate">{current?.name ?? "Nenhum servidor"}</span>
          <ChevronsUpDown className="h-3.5 w-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel className="font-mono text-[10px] uppercase tracking-wider">
          Seus servidores
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {servers.length === 0 && (
          <div className="px-2 py-3 text-xs text-muted-foreground">Nenhum servidor ainda.</div>
        )}
        {servers.map((s) => (
          <DropdownMenuItem
            key={s.id}
            onClick={() => setCurrent(s)}
            className={current?.id === s.id ? "bg-accent/30" : ""}
          >
            <Server className="mr-2 h-3.5 w-3.5" />
            <span className="truncate">{s.name}</span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={createDemoServer} className="text-primary">
          <Plus className="mr-2 h-3.5 w-3.5" />
          Criar servidor demo
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
