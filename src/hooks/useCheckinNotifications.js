import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';

const SW_FILENAME = 'checkin-notification-sw.js';
const SW_URL = `/${SW_FILENAME}`;

const STORAGE_KEYS = {
  morning: 'vida_checkin_notification_morning_last_sent',
  evening: 'vida_checkin_notification_evening_last_sent',
  completed: 'vida_checkin_notification_last_completed',
};

const REMINDERS = [
  {
    id: 'morning',
    hour: 8,
    minute: 0,
    title: 'Bom dia! Hora do check-in',
    body: 'Como você está se sentindo hoje? Compartilhe seu check-in matinal para ganhar pontos e orientar a IA Coach.',
    storageKey: STORAGE_KEYS.morning,
  },
  {
    id: 'evening',
    hour: 20,
    minute: 0,
    title: 'Como foi o seu dia?',
    body: 'Faça o check-in da noite e registre seus progressos. A IA Coach acompanha cada passo com você.',
    storageKey: STORAGE_KEYS.evening,
  },
];

const formatDateKey = (date) => date.toISOString().split('T')[0];

const isNotificationSupported = () =>
  typeof window !== 'undefined' &&
  'Notification' in window &&
  'serviceWorker' in navigator;

const resolveRegistrationScriptURL = (registration) =>
  registration?.active?.scriptURL ||
  registration?.waiting?.scriptURL ||
  registration?.installing?.scriptURL ||
  '';

const ensureCheckinServiceWorker = async () => {
  if (!isNotificationSupported()) return null;

  const registrations = await navigator.serviceWorker.getRegistrations();
  const existing = registrations.find((reg) =>
    resolveRegistrationScriptURL(reg).includes(SW_FILENAME)
  );

  if (existing) {
    return existing;
  }

  try {
    const registration = await navigator.serviceWorker.register(SW_URL, {
      scope: '/',
    });
    return registration;
  } catch (error) {
    console.error('Falha ao registrar service worker de notificações:', error);
    return null;
  }
};

const getNextOccurrence = (hour, minute, forceTomorrow = false) => {
  const now = new Date();
  const target = new Date();
  target.setHours(hour, minute, 0, 0);

  if (forceTomorrow || target <= now) {
    target.setDate(target.getDate() + 1);
    target.setHours(hour, minute, 0, 0);
  }

  return target;
};

const hasSentToday = (storageKey) => {
  const today = formatDateKey(new Date());
  return localStorage.getItem(storageKey) === today;
};

const markSent = (storageKey, date) => {
  localStorage.setItem(storageKey, formatDateKey(date));
};

const markCompletedToday = () => {
  localStorage.setItem(STORAGE_KEYS.completed, formatDateKey(new Date()));
};

const didCompleteToday = () => {
  const today = formatDateKey(new Date());
  return localStorage.getItem(STORAGE_KEYS.completed) === today;
};

export const useCheckinNotifications = ({
  enabled,
  hasCompletedToday,
  userName,
  onFocusRequest,
} = {}) => {
  const isSupported = useMemo(() => isNotificationSupported(), []);
  const [permission, setPermission] = useState(() =>
    isSupported ? Notification.permission : 'denied'
  );
  const [registration, setRegistration] = useState(null);
  const timersRef = useRef([]);
  const [reminders, setReminders] = useState([]);

  useEffect(() => {
    if (isSupported) {
      setPermission(Notification.permission);
    }
  }, [isSupported]);

  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      toast.error('Notificações do navegador não são suportadas neste dispositivo.');
      return 'denied';
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === 'granted') {
        toast.success('Notificações ativadas! Você receberá lembretes diários de check-in.');
      } else if (result === 'denied') {
        toast.error('Você negou as notificações. Ative-as nas configurações do navegador, se desejar receber lembretes.');
      }
      return result;
    } catch (error) {
      console.error('Erro ao solicitar permissão de notificação:', error);
      toast.error('Não foi possível solicitar permissão de notificação.');
      return 'denied';
    }
  }, [isSupported]);

  useEffect(() => {
    if (!isSupported) return;
    let cancelled = false;

    ensureCheckinServiceWorker().then((reg) => {
      if (!cancelled) {
        setRegistration(reg);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isSupported]);

  useEffect(() => {
    timersRef.current.forEach((id) => clearTimeout(id));
    timersRef.current = [];
    setReminders([]);

    if (!isSupported) return;
    if (permission !== 'granted') return;
    if (!enabled) return;
    if (!registration) return;

    if (hasCompletedToday) {
      markCompletedToday();
    }

    const cancelToken = { cancelled: false };
    const upcoming = [];

    const scheduleReminder = (reminder, forceNextDay = false) => {
      if (cancelToken.cancelled) return;

      const todayAlreadyCompleted = didCompleteToday();
      const skipToday = forceNextDay || todayAlreadyCompleted || hasSentToday(reminder.storageKey);
      const nextDate = getNextOccurrence(
        reminder.hour,
        reminder.minute,
        skipToday
      );

      const delay = nextDate.getTime() - Date.now();
      const timerId = window.setTimeout(async () => {
        try {
          const readyRegistration = await navigator.serviceWorker.ready;
          const activeRegistration = readyRegistration || registration;
          await activeRegistration.showNotification(reminder.title, {
            body: reminder.body,
            tag: `checkin-${reminder.id}`,
            data: { reminderId: reminder.id, target: '/dashboard?tab=dashboard' },
          });
          markSent(reminder.storageKey, nextDate);
        } catch (error) {
          console.error('Erro ao exibir notificação de check-in:', error);
        }
        if (!cancelToken.cancelled) {
          scheduleReminder(reminder, true);
        }
      }, delay);

      timersRef.current.push(timerId);
      upcoming.push({ id: reminder.id, date: nextDate });
    };

    REMINDERS.forEach((reminder) => {
      scheduleReminder(reminder);
    });

    setReminders(upcoming);

    return () => {
      cancelToken.cancelled = true;
      timersRef.current.forEach((id) => clearTimeout(id));
      timersRef.current = [];
      setReminders([]);
    };
  }, [isSupported, permission, enabled, registration, hasCompletedToday]);

  const nextReminders = useMemo(() => {
    if (!reminders.length) return [];
    return reminders
      .map(({ id, date }) => ({
        id,
        date,
        formatted: date.toLocaleString('pt-BR', {
          weekday: 'short',
          hour: '2-digit',
          minute: '2-digit',
        }),
      }))
      .sort((a, b) => a.date - b.date);
  }, [reminders]);

  // Escuta mensagens do Service Worker para focar o check-in quando solicitado
  useEffect(() => {
    if (!isSupported) return undefined;
    if (typeof onFocusRequest !== 'function') return undefined;
    const handler = (event) => {
      if (event?.data?.type === 'FOCUS_CHECKIN') {
        onFocusRequest();
      }
    };
    navigator.serviceWorker?.addEventListener?.('message', handler);
    return () => {
      navigator.serviceWorker?.removeEventListener?.('message', handler);
    };
  }, [isSupported, onFocusRequest]);

  return {
    supported: isSupported,
    permission,
    requestPermission,
    nextReminders,
    hasNotificationsEnabled: permission === 'granted' && enabled,
    userName,
  };
};
  
