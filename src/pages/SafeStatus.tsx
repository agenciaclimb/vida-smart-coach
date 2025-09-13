export default function SafeStatus() {
  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h1>✅ Safe Status</h1>
      <p>App renderizado sem redirecionamento.</p>
      <ul>
        <li>Rota: /safe</li>
        <li>Use <code>?safe=1</code> em qualquer URL para entrar em modo seguro.</li>
      </ul>
      <div style={{ marginTop: 20, padding: 16, backgroundColor: '#f0f9ff', borderRadius: 8 }}>
        <h3>🔧 Debug Info</h3>
        <p><strong>Timestamp:</strong> {new Date().toISOString()}</p>
        <p><strong>URL:</strong> {window.location.href}</p>
        <p><strong>Environment:</strong> {import.meta.env.MODE}</p>
        <p><strong>Supabase URL:</strong> {import.meta.env.VITE_SUPABASE_URL ? '✅ Configured' : '❌ Missing'}</p>
        <p><strong>Supabase Key:</strong> {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Configured' : '❌ Missing'}</p>
      </div>
    </div>
  );
}