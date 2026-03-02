'use client';

import * as React from 'react';

type TzSection = {
  id: string;
  title: string;
  content: string;
  order_index: number;
};

type TzDetail = {
  id: string;
  title: string;
  version: number;
  status: string;
  created_at: string;
  sections: TzSection[];
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function TZDetailPage({ params }: PageProps) {
  // Next.js: params is a Promise -> unwrap with React.use() in Client Component
  const { id } = React.use(params); // [web:716]

  const [data, setData] = React.useState<TzDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState('');

  const [remarks, setRemarks] = React.useState('');
  const [creatingVersion, setCreatingVersion] = React.useState(false);

  const loadTz = React.useCallback(async () => {
    setLoading(true);
    setErr('');
    try {
      const res = await fetch(`/api/agents/tz/${id}`, { cache: 'no-store' });
      const text = await res.text();
      let payload: any = null;
      try {
        payload = text ? JSON.parse(text) : null;
      } catch {
        payload = { raw: text };
      }
      if (!res.ok) throw new Error(payload?.detail || payload?.message || text || `HTTP ${res.status}`);
      setData(payload);
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    loadTz();
  }, [loadTz]);

  const copyText = async (text: string) => {
    await navigator.clipboard.writeText(text);
    alert('Скопировано в буфер обмена');
  };

  const exportMarkdown = () => {
    if (!data) return;
    const sorted = [...(data.sections || [])].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
    const md =
      `# ${data.title}\n\n` +
      `ID: ${data.id}\n\n` +
      `Версия: ${data.version} | Статус: ${data.status} | Создано: ${data.created_at}\n\n` +
      sorted.map((s) => `## ${s.title}\n\n${s.content}\n`).join('\n');

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `TZ_${data.id}_v${data.version}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
  };

  const createV2 = async () => {
    if (!data) return;
    if (!remarks.trim()) {
      alert('Введи промт/замечания для новой версии.');
      return;
    }

    setCreatingVersion(true);
    setErr('');
    try {
      const newTitle = `v${data.version + 1}. Правки к ТЗ "${data.title}" (id=${data.id}): ${remarks.trim()}`;

      const res = await fetch('/api/agents/design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle }),
      });

      const text = await res.text();
      let payload: any = null;
      try {
        payload = text ? JSON.parse(text) : null;
      } catch {
        payload = null;
      }

      if (!res.ok) throw new Error(payload?.detail || payload?.message || text || `HTTP ${res.status}`);

      // Если backend вернул новый spec id — откроем его сразу, иначе вернёмся на список
      const newId = payload?.id || payload?.spec_id || payload?.tz_id;
      if (newId) {
        window.location.href = `/tz/${newId}`;
      } else {
        window.location.href = `/tz`;
      }
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    } finally {
      setCreatingVersion(false);
    }
  };

  const sections = data?.sections ? [...data.sections].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)) : [];

  return (
    <div className="max-w-6xl mx-auto">
      <a href="/tz" className="text-blue-400 hover:text-blue-300 text-sm mb-4 inline-block">
        ← Назад к списку ТЗ
      </a>

      {loading && <div className="text-gray-400 p-6">Загрузка ТЗ {id}…</div>}

      {err && (
        <div className="text-sm text-red-300 bg-red-950/40 border border-red-900 rounded-lg p-3 mb-6">
          Ошибка: {err}
        </div>
      )}

      {!loading && data && (
        <>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-white mb-2">{data.title}</h1>
                <div className="text-xs text-gray-500">
                  id: <span className="text-gray-300">{data.id}</span> | status:{' '}
                  <span className="text-gray-300">{data.status}</span> | version:{' '}
                  <span className="text-gray-300">{data.version}</span> | created:{' '}
                  <span className="text-gray-300">{new Date(data.created_at).toLocaleString()}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => copyText(JSON.stringify(data, null, 2))}
                  className="bg-gray-800 hover:bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-700"
                >
                  Копировать JSON
                </button>
                <button
                  onClick={exportMarkdown}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 font-medium"
                >
                  Скачать .md
                </button>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">Разделы</h2>

            {sections.length === 0 ? (
              <div className="text-gray-400">Разделов нет (sections пустой).</div>
            ) : (
              <div className="space-y-4">
                {sections.map((sec) => (
                  <div key={sec.id} className="border border-gray-800 rounded-lg p-4">
                    <div className="flex justify-between items-start gap-3">
                      <h3 className="text-white font-semibold">{sec.title}</h3>
                      <button
                        onClick={() => copyText(sec.content)}
                        className="text-xs text-blue-400 hover:text-blue-300"
                      >
                        Копировать раздел
                      </button>
                    </div>
                    <div className="text-sm text-gray-300 whitespace-pre-wrap mt-2">{sec.content}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-2">Новая версия ТЗ</h2>
            <div className="text-gray-400 text-sm mb-3">
              Пиши правки “человеческим языком”. Пример: “Добавь раздел ‘Состав поставки’, уточни перегрузочную способность, приведи требования к охлаждению по ГОСТ 18142.1-85”.
            </div>

            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 min-h-28 mb-3 outline-none focus:border-blue-500"
              placeholder="Замечания / промт..."
            />

            <div className="flex gap-2">
              <button
                onClick={createV2}
                disabled={creatingVersion}
                className="bg-green-600 hover:bg-green-700 disabled:bg-green-900 text-white rounded-lg px-6 py-2 font-medium"
              >
                {creatingVersion ? 'Создаю…' : 'Создать v2'}
              </button>

              <button
                onClick={loadTz}
                className="bg-gray-800 hover:bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-700"
              >
                Обновить ТЗ
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
