'use client';

export default function Home() {
  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-4xl font-bold text-white mb-4">Rectifier Spec Generator</h1>
      <p className="text-xl text-gray-400 mb-8">
        Автоматическая разработка ТЗ для выпрямителей (250А 80В, ГОСТ 18142, тяговые подстанции).
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-blue-500 transition-colors">
          <h2 className="text-2xl font-semibold text-white mb-3">📋 ТЗ</h2>
          <p className="text-gray-400 mb-4">
            Создание и просмотр технических заданий.
          </p>
          <a
            href="/tz"
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 py-3 font-medium inline-block"
          >
            Перейти к ТЗ →
          </a>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-green-500 transition-colors">
          <h2 className="text-2xl font-semibold text-white mb-3">📚 Библиотека</h2>
          <p className="text-gray-400 mb-4">
            Загрузка и поиск ГОСТ/документов для RAG.
          </p>
          <a
            href="/library"
            className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-6 py-3 font-medium inline-block"
          >
            Перейти к библиотеке →
          </a>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-purple-500 transition-colors">
          <h2 className="text-2xl font-semibold text-white mb-3">🤖 Research</h2>
          <p className="text-gray-400 mb-4">
            Поиск источников (ГОСТ/статьи) и авто-сохранение.
          </p>
          <a
            href="/research"
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-6 py-3 font-medium inline-block"
          >
            Перейти к Research →
          </a>
        </div>
      </div>
    </div>
  );
}
