import { useEffect, useState } from 'react';
import { supabase } from '@/core/supabase';

export default function BootWrapper({ children }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort();
      if (alive) {
        console.log('Boot: edge-timeout, proceeding anyway');
        setReady(true);
      }
    }, 3000);

    (async () => {
      try {
        console.log('Boot: edge-start');
        const { error } = await supabase.functions.invoke('user-creation-fix', {
          body: { ping: true },
          signal: controller.signal,
        });
        if (error) console.error('Boot: edge-error', error);
        else console.log('Boot: edge-ok');
      } catch (e) {
        console.warn('Boot: edge-timeout/ignored', e.message);
      } finally {
        clearTimeout(timer);
        if (alive) {
          console.log('Boot: ready');
          setReady(true);
        }
      }
    })();

    return () => { 
      alive = false; 
      controller.abort(); 
      clearTimeout(timer);
    };
  }, []);

  if (!ready) return <div>Carregando…</div>;
  return <>{children}</>;
}
