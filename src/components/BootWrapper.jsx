import { useEffect, useState } from 'react';
import { supabase } from '@/core/supabase';

export default function BootWrapper({ children }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);

    (async () => {
      try {
        const { error } = await supabase.functions.invoke('user-creation-fix', {
          body: { ping: true },
          signal: controller.signal,
        });
        if (error) console.error('edge error:', error);
      } catch (e) {
        console.warn('edge timeout/ignored:', e);
      } finally {
        clearTimeout(timer);
        if (alive) setReady(true);
      }
    })();

    return () => { alive = false; controller.abort(); };
  }, []);

  if (!ready) return <div>Carregando…</div>;
  return <>{children}</>;
}
