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
      <body>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'sans-serif' }}>
          <h2 style={{ fontSize: 20, marginBottom: 16 }}>Algo deu errado</h2>
          <button
            onClick={() => reset()}
            style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#333', color: '#fff', cursor: 'pointer', fontSize: 14 }}
          >
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  );
}
