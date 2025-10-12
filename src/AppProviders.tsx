import AuthProvider from '@/components/auth/AuthProvider';
import { PlansRewardsProvider } from '@/contexts/data/PlansRewardsContext';
import { PaymentRequiredModal } from '@/components/ui/PaymentRequiredModal';

type Props = { children: React.ReactNode };

export default function AppProviders({ children }: Props) {
  return (
    <AuthProvider>
      <PlansRewardsProvider>
        {children}
        <PaymentRequiredModal />
      </PlansRewardsProvider>
    </AuthProvider>
  );
}
