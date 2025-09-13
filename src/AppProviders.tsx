import { AuthProvider } from '@/components/auth/AuthProvider';

type Props = { children: React.ReactNode };

export default function AppProviders({ children }: Props) {
  return <AuthProvider>{children}</AuthProvider>;
}
