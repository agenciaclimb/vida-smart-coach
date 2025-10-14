import { useAuth } from '../components/auth/AuthProvider';
import { useEffect, useState } from 'react';

interface TrialStatus {
  isActive: boolean;
  isTrialing: boolean;
  isExpired: boolean;
  daysRemaining: number | null;
}

const useTrialStatus = (): TrialStatus => {
  const { user } = useAuth(); // Use the user object from the auth context
  const [status, setStatus] = useState<TrialStatus>({
    isActive: false,
    isTrialing: false,
    isExpired: false,
    daysRemaining: null,
  });

  useEffect(() => {
    if (!user?.profile) { // Check for user and user.profile
      return;
    }

    const { billing_status, trial_expires_at } = user.profile;

    const isActive = billing_status === 'active';
    const isTrialing = billing_status === 'trialing';

    if (isActive) {
      setStatus({
        isActive: true,
        isTrialing: false,
        isExpired: false,
        daysRemaining: null,
      });
      return;
    }

    if (isTrialing && trial_expires_at) {
      const now = new Date();
      const expiresAt = new Date(trial_expires_at);
      const diffTime = expiresAt.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const isExpired = diffDays <= 0;

      setStatus({
        isActive: false,
        isTrialing: true,
        isExpired: isExpired,
        daysRemaining: isExpired ? 0 : diffDays,
      });
    } else {
        // Se não está ativo nem em trial, considera expirado (ex: cancelado, não pago)
        setStatus({
            isActive: false,
            isTrialing: false,
            isExpired: true,
            daysRemaining: 0,
        });
    }

  }, [user?.profile]); // Depend on user.profile

  return status;
};

export default useTrialStatus;
