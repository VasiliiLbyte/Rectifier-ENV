'use client';

import { useEffect, useState } from 'react';

type TzItem = {
  id: string;
  title: string;
  version: number;
  status: string;
  created_at: string;
};

export default function TZPage() {
  const [items, setItems] = useState<TzItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>('');

  const [title, setTitle] = useState(
    'Выпрямитель 250А 80В для тяговой подстанции (ГОСТ 18142, охлаждение, защита)'
  );
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    setErr('');
    try {
      const res = await fetch('/api/agents/tz', { cache: 'no-store' });
      const text = await res.text();
      const data = text ? JSON.parse(text) : [];
      if (!res.ok) throw new Error(data?.detail || data?.message || `HTTP ${res.status}`);
      setItems(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setErr(e?.message ?? String(e));
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const create = async () => {
    if (!title.trim()) return;
    setCreating(true);
    setErr('');
    try {
      const res = await fetch('/api/agents/design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim() }),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(text || `HTTP ${res.status}`);
      await load();
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="max-w-6xl">
      <h1 className="text-3xl font-bold text-white mb-2">📋 Технические задания</h1>
      <p className="text-gray-400 mb-6">
        Список ТЗ из backend (/api/agents/tz). Создавай новые и открывай для редактирования.
      </p>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-3">➕ Создать ТЗ</h2>

        <div className="flex flex-col md:flex-row gap-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 outline-none focus:border-blue-500"
          />
          <button
            onClick={create}
            disabled={creating}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 text-white rounded-lg px-4 py-2 font-medium"
          >
            {creating ? 'Создаю…' : 'Создать'}
          </button>
          <button
            onClick={load}
            className="bg-gray-800 hover:bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-700"
          >
            Обновить
          </button>
        </div>

        {err && (
          <div className="mt-4 text-sm text-red-300 bg-red-950/40 border border-red-900 rounded-lg p-3">
            Ошибка: {err}
          </div>
        )}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Список ТЗ</h2>

        {loading ? (
          <div className="text-gray-400">Загрузка…</div>
        ) : items.length === 0 ? (
          <div className="text-gray-400">Пока ТЗ нет (или backend вернул пустой список).</div>
        ) : (
          <div className="space-y-3">
            {items.map((x) => (
              <div
                key={x.id}
                className="border border-gray-800 rounded-lg p-4 hover:border-blue-500 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-white font-semibold">{x.title}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      status: <span className="text-gray-300">{x.status}</span> | version: <span className="text-gray-300">{x.version}</span> | created: <span className="text-gray-300">{new Date(x.created_at).toLocaleString()}</span>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">id: {x.id}</div>
                  </div>
                  <a
                    href={`/tz/${x.id}`}
                    className="text-blue-400 hover:text-blue-300 text-sm font-medium px-3 py-1 rounded border border-blue-500/50 ml-2"
                  >
                    Открыть
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
