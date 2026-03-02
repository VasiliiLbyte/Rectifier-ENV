export default function NotFound() {
  return (
    <div className="max-w-4xl p-6">
      <h1 className="text-2xl font-bold text-white mb-2">404 — Страница не найдена</h1>
      <p className="text-gray-400">Проверь URL или вернись на главную.</p>
      <a className="text-blue-400 hover:text-blue-300 inline-block mt-4" href="/">
        ← На главную
      </a>
    </div>
  );
}
