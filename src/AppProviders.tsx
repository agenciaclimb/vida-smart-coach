import { AuthProvider } from '@/contexts/SupabaseAuthContext_FINAL';

type Props = { children: React.ReactNode };

export default function AppProviders({ children }: Props) {
  return <AuthProvider>{children}</AuthProvider>;
}
