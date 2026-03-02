'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-4xl p-6">
      <h2 className="text-xl font-bold text-white mb-2">Ошибка в интерфейсе</h2>
      <p className="text-gray-400 mb-4">
        Это fallback-экран Next.js для ошибок в сегменте маршрута.
      </p>

      <pre className="text-xs text-red-300 bg-red-950/40 border border-red-900 rounded-lg p-3 whitespace-pre-wrap">
        {String(error?.message ?? error)}
      </pre>

      <button
        className="mt-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 font-medium"
        onClick={() => reset()}
      >
        Попробовать снова
      </button>
    </div>
  );
}
