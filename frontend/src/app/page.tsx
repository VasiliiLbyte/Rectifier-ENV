export default function Home() {
  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-bold text-white mb-2">
        ⚡ Добро пожаловать в Rectifier ENV
      </h1>
      <p className="text-gray-400 mb-8">
        AI-агентная среда разработки выпрямителя тока для тяговых подстанций
      </p>

      {/* Карточки разделов */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-blue-500 transition-colors">
          <div className="text-2xl mb-3">📚</div>
          <h2 className="text-lg font-semibold text-white mb-2">Библиотека данных</h2>
          <p className="text-gray-400 text-sm">
            Хранилище нормативов, стандартов и технических документов. Пополняется вручную и AI-агентами.
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-blue-500 transition-colors">
          <div className="text-2xl mb-3">📋</div>
          <h2 className="text-lg font-semibold text-white mb-2">Техническое задание</h2>
          <p className="text-gray-400 text-sm">
            Структурированное ТЗ с версионированием и статусами согласования.
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-blue-500 transition-colors">
          <div className="text-2xl mb-3">🤖</div>
          <h2 className="text-lg font-semibold text-white mb-2">AI-агенты</h2>
          <p className="text-gray-400 text-sm">
            Research, Design, Validator агенты работают в реальном времени.
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-blue-500 transition-colors">
          <div className="text-2xl mb-3">✅</div>
          <h2 className="text-lg font-semibold text-white mb-2">Валидация</h2>
          <p className="text-gray-400 text-sm">
            Трёхуровневая проверка данных, расчётов и технических решений.
          </p>
        </div>
      </div>

      {/* Статус сервисов */}
      <div className="mt-8 bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">🔧 Статус сервисов</h2>
        <div className="space-y-2">
          {[
            { name: "FastAPI Backend", port: "8000" },
            { name: "PostgreSQL", port: "5432" },
            { name: "ChromaDB", port: "8001" },
            { name: "Next.js Frontend", port: "3000" },
          ].map((service) => (
            <div key={service.name} className="flex items-center justify-between">
              <span className="text-gray-300 text-sm">{service.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">:{service.port}</span>
                <span className="flex items-center gap-1 text-xs text-green-400">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Online
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
