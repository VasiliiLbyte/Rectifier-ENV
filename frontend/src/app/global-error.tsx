'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body style={{ background: '#0a0a0a', color: '#ededed', fontFamily: 'Arial, Helvetica, sans-serif' }}>
        <div style={{ maxWidth: 900, margin: '40px auto', padding: 24 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Глобальная ошибка приложения</h2>
          <p style={{ opacity: 0.8, marginBottom: 12 }}>
            Этот экран появляется, если ошибка произошла на уровне root layout.
          </p>

          <pre style={{ fontSize: 12, whiteSpace: 'pre-wrap', padding: 12, border: '1px solid #7f1d1d', background: 'rgba(127,29,29,0.25)' }}>
            {String(error?.message ?? error)}
          </pre>

          <button
            style={{ marginTop: 16, padding: '10px 14px', borderRadius: 10, background: '#2563eb', color: 'white', border: 0, cursor: 'pointer' }}
            onClick={() => reset()}
          >
            Попробовать снова
          </button>
        </div>
      </body>
    </html>
  );
}
