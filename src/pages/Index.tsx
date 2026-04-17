import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export default function Index() {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center font-mono text-xs text-muted-foreground">…</div>;
  return <Navigate to={user ? "/dashboard" : "/auth"} replace />;
}
