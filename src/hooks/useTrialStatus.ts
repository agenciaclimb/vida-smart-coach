import { useState, useEffect } from 'react';
import { useAuth } from '../components/auth/AuthProvider'; // Corrected path

export const useTrialStatus = () => {
  const { user, loading } = useAuth(); // Use the main AuthProvider
  const [trialStatus, setTrialStatus] = useState({
    daysRemaining: null,
    isExpired: false,
    billingStatus: null,
    isLoading: true,
  });

  useEffect(() => {
    if (loading) {
      setTrialStatus(prev => ({ ...prev, isLoading: true }));
      return;
    }

    const profile = user?.profile; // Profile is nested inside the user object

    if (!profile) {
      setTrialStatus({
        daysRemaining: null,
        isExpired: false,
        billingStatus: null,
        isLoading: false,
      });
      return;
    }

    const { trial_expires_at, billing_status } = profile;
    const now = new Date();
    const expiryDate = trial_expires_at ? new Date(trial_expires_at) : null;

    let daysRemaining = null;
    if (expiryDate) {
      const diffTime = expiryDate.getTime() - now.getTime();
      daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }

    const isExpired = billing_status === 'trialing' && daysRemaining !== null && daysRemaining <= 0;

    setTrialStatus({
      daysRemaining,
      isExpired,
      billingStatus: billing_status,
      isLoading: false,
    });

  }, [user, loading]); // Depend on user and loading from useAuth

  return trialStatus;
};
