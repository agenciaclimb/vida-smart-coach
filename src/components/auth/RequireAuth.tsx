import { PropsWithChildren, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSessionContext } from "@supabase/auth-helpers-react";

export default function RequireAuth({ children }: PropsWithChildren) {
  const { isLoading, session } = useSessionContext();
  const navigate = useNavigate();

  // Enquanto o Supabase ainda carrega a sessão, mostra um loading simples
  if (isLoading) {
    return <div style={{ padding: 24 }}>Carregando...</div>;
  }

  // Se não tem sessão, manda para /login
  useEffect(() => {
    if (!isLoading && !session) {
      navigate("/login", { replace: true });
    }
  }, [isLoading, session, navigate]);

  // Se tem sessão, renderiza o conteúdo protegido
  if (session) return <>{children}</>;
  return null; // evita flicker
}

